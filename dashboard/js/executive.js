(function () {
  "use strict";

  const U = BI.utils;
  const F = BI.filters;
  const C = BI.charts;
  const filterIds = ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "salesmanFilter"];

  window.addEventListener("DOMContentLoaded", async () => {
    await U.loadDashboardData();
    F.fillFilters(U.getCoreProductData(), { yearLabel: "All years" });
    F.bindFilters(update, filterIds);
    update();
  });

  function rows() {
    return F.applyFilters(U.getCoreProductData());
  }

  function update() {
    const data = rows();
    const summary = U.kpi(data);
    const groups = {
      dealers: U.groupBy(data, (item) => item.dealer),
      models: U.groupBy(data, (item) => item.model),
      types: U.groupBy(data, (item) => item.type),
      regions: U.groupBy(data, (item) => item.region),
      salesmen: U.groupBy(data, U.salesmanName),
      months: monthlyRows(data)
    };
    const intelligence = buildIntelligence(summary, groups, data);

    renderKpis(summary, intelligence);
    BI.enterprise?.refresh(data);
    renderBriefing(intelligence);
    renderTrend(groups.months);
    renderDealerChart(groups.dealers);
    renderProductMix(groups.types);
    renderModelTable(groups.models);
    renderBooking(groups.months);
    renderMarginQuality(summary, groups.models, groups.types);
    renderPipeline(summary, groups.months);
    renderForecastGap(summary, groups.months, groups.dealers, intelligence);
    renderRiskOpportunity(intelligence);
    renderAlertCenter(intelligence.alerts);
    renderCards("dealerCards", groups.dealers.slice(0, 3), "dealer.html", "Dealer");
    renderCards("productCards", groups.types.slice(0, 3), "product.html", "Product");
    renderExecutiveStrip(summary, groups, intelligence);
  }

  function monthlyRows(data) {
    return U.groupBy(data, (item) => U.monthName(item.month)).reverse();
  }

  function renderKpis(summary, intelligence) {
    BI.core.renderKpis(summary);
    U.setText("kpiForecast", intelligence.forecast.toLocaleString());
    U.setText("kpiGap", `${intelligence.gap >= 0 ? "+" : ""}${intelligence.gap.toLocaleString()}`);
  }

  function chartBaseOptions(extra = {}) {
    const base = {
      resizeDelay: 120,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label(context) {
              const label = context.dataset.label ? `${context.dataset.label}: ` : "";
              const parsed = context.parsed.y ?? context.parsed.x ?? context.parsed;
              return label + Number(parsed || 0).toLocaleString();
            }
          }
        }
      }
    };
    return C.commonOptions(deepMerge(base, extra));
  }

  function orangeGradient(context) {
    const chart = context.chart;
    const area = chart.chartArea;
    if (!area) return "rgba(243, 107, 33, 0.35)";
    const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, "rgba(243, 107, 33, 0.42)");
    gradient.addColorStop(1, "rgba(243, 107, 33, 0.03)");
    return gradient;
  }

  function renderTrend(monthly) {
    C.renderChart("trendChart", {
      type: "line",
      data: {
        labels: monthly.map((item) => item.name),
        datasets: [
          {
            label: "Sales Units",
            data: monthly.map((item) => item.units),
            borderColor: "#f36b21",
            backgroundColor: orangeGradient,
            fill: true,
            tension: 0.38
          },
          {
            label: "Sales Value (100M MMK)",
            data: monthly.map((item) => Math.round(item.sales / 1e8)),
            borderColor: "#12b89d",
            backgroundColor: "rgba(18, 184, 157, 0.12)",
            borderDash: [6, 5],
            tension: 0.32
          }
        ]
      },
      options: chartBaseOptions({
        scales: {
          y: { ticks: { callback: (value) => Number(value).toLocaleString() } }
        }
      })
    });
  }

  function renderDealerChart(dealers) {
    const top = dealers.slice(0, 7).reverse();
    C.renderChart("dealerChart", {
      type: "bar",
      data: {
        labels: top.map((item) => item.name),
        datasets: [{
          label: "Units",
          data: top.map((item) => item.units),
          backgroundColor: top.map((item, index) => index === top.length - 1 ? "#f36b21" : "rgba(23, 32, 51, 0.78)"),
          borderRadius: 12,
          borderSkipped: false
        }]
      },
      options: chartBaseOptions({
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { autoSkip: false } }
        }
      })
    });
  }

  function renderProductMix(types) {
    C.renderChart("typeChart", {
      type: "doughnut",
      data: {
        labels: types.slice(0, 6).map((item) => item.name),
        datasets: [{
          data: types.slice(0, 6).map((item) => item.units),
          backgroundColor: ["#f36b21", "#172033", "#12b89d", "#2764c5", "#b7791f", "#7a8599"],
          borderRadius: 12,
          spacing: 4
        }]
      },
      options: chartBaseOptions({
        cutout: "64%",
        plugins: { legend: { position: "bottom" } }
      })
    });
  }

  function renderModelTable(models) {
    U.setHtml("modelTable", models.slice(0, 5).map((item) => `
      <tr>
        <td><a href="product.html">${item.name}</a></td>
        <td class="text-right">${item.units.toLocaleString()}</td>
        <td class="text-right">${U.formatPercent(item.share)}</td>
        <td class="text-right">${U.formatPercent(item.gpPct)}</td>
      </tr>`).join("") || `<tr><td colspan="4">No model data</td></tr>`);
  }

  function renderBooking(monthly) {
    const recent = monthly.slice(-6);
    C.renderChart("bookingChart", {
      type: "bar",
      data: {
        labels: recent.map((item) => item.name),
        datasets: [
          { label: "Booking Proxy", data: recent.map((item) => Math.round(item.units * 1.18)), backgroundColor: "#f36b21", borderRadius: 10, borderSkipped: false },
          { label: "Delivery", data: recent.map((item) => item.units), backgroundColor: "#172033", borderRadius: 10, borderSkipped: false }
        ]
      },
      options: chartBaseOptions({
        scales: { x: { stacked: false }, y: { beginAtZero: true } }
      })
    });
  }

  function buildIntelligence(summary, groups, data) {
    const topDealer = safe(groups.dealers[0]);
    const weakDealer = safe(groups.dealers.at(-1));
    const topModel = safe(groups.models[0]);
    const topType = safe(groups.types[0]);
    const topSalesman = safe(groups.salesmen[0]);
    const lowMarginModel = safe(groups.models.slice().sort((a, b) => a.gpPct - b.gpPct)[0]);
    const highMarginModel = safe(groups.models.slice().sort((a, b) => b.gpPct - a.gpPct)[0]);
    const bestMonth = safe(groups.months.slice().sort((a, b) => b.units - a.units)[0]);
    const lastMonth = safe(groups.months.at(-1));
    const previousMonth = safe(groups.months.at(-2));
    const momentum = lastMonth.units - previousMonth.units;
    const forecast = Math.round(summary.units * 1.08);
    const target = Math.max(400, Math.round(summary.units * 1.12));
    const gap = forecast - target;
    const gpRisk = summary.gpPct < 8;
    const concentrationRisk = topDealer.share > 45;
    const gapRisk = gap < 0;
    const hasBookingFields = data.some((item) => Object.keys(item).some((key) => /book|pipeline|stock/i.test(key)));
    const stockSignal = hasBookingFields ? "Source contains booking, pipeline, or stock-like fields." : "No explicit stock or booking fields found; using booking proxy.";

    return {
      topDealer,
      weakDealer,
      topModel,
      topType,
      topSalesman,
      lowMarginModel,
      highMarginModel,
      bestMonth,
      lastMonth,
      momentum,
      forecast,
      target,
      gap,
      stockSignal,
      topSignal: data.length ? `${topDealer.name} leads with ${topDealer.units.toLocaleString()} units while ${topModel.name} anchors demand.` : "No records match the current filters.",
      mainRisk: gpRisk ? `GP margin is ${U.formatPercent(summary.gpPct)}` : concentrationRisk ? `${topDealer.name} holds ${U.formatPercent(topDealer.share)} share` : gapRisk ? `${Math.abs(gap).toLocaleString()} unit forecast gap` : "No red risk in current filter",
      recommendedAction: data.length ? recommendedAction(gpRisk, concentrationRisk, gapRisk, lowMarginModel, weakDealer, topModel) : "Broaden filters to restore executive coverage.",
      alerts: [
        alert("GP Risk", gpRisk ? "red" : summary.gpPct < 11 ? "yellow" : "green", `${U.formatPercent(summary.gpPct)} GP margin. Lowest model: ${lowMarginModel.name}.`),
        alert("Dealer Concentration", concentrationRisk ? "red" : topDealer.share > 30 ? "yellow" : "green", `${topDealer.name} contributes ${U.formatPercent(topDealer.share)} of filtered units.`),
        alert("Forecast Gap", gapRisk ? "yellow" : "green", `${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units vs ${target.toLocaleString()} static baseline.`),
        alert("Stock / Booking", hasBookingFields ? "green" : "yellow", stockSignal)
      ]
    };
  }

  function recommendedAction(gpRisk, concentrationRisk, gapRisk, lowMarginModel, weakDealer, topModel) {
    if (gpRisk) return `Protect margin first: review discounting and deal economics on ${lowMarginModel.name}.`;
    if (concentrationRisk) return `Reduce network dependency: lift activity and stock follow-up for ${weakDealer.name}.`;
    if (gapRisk) return `Close the gap through high-probability deals led by ${topModel.name}.`;
    return `Sustain close rhythm and keep ${topModel.name} availability visible across priority dealers.`;
  }

  function renderBriefing(intel) {
    U.setText("briefTopSignal", intel.topSignal);
    U.setText("briefRecommendedAction", intel.recommendedAction);
    U.setText("briefMainRisk", intel.mainRisk);
    U.setText("briefDealerWatch", intel.weakDealer.name);
    U.setText("briefProductPush", intel.highMarginModel.name || intel.topModel.name);
    U.setText("briefSalesmanSignal", intel.topSalesman.name);
    U.setHtml("briefSignalChips", [
      `${intel.forecast.toLocaleString()} forecast units`,
      `${intel.gap >= 0 ? "+" : ""}${intel.gap.toLocaleString()} target gap`,
      `${U.formatPercent(intel.topDealer.share)} top dealer share`
    ].map((chip) => `<span class="command-chip">${chip}</span>`).join(""));
  }

  function renderMarginQuality(summary, models, types) {
    const low = safe(models.slice().sort((a, b) => a.gpPct - b.gpPct)[0]);
    const high = safe(models.slice().sort((a, b) => b.gpPct - a.gpPct)[0]);
    const type = safe(types.slice().sort((a, b) => a.gpPct - b.gpPct)[0]);
    U.setHtml("marginQualityPanel", [
      quality("GP Margin", U.formatPercent(summary.gpPct), summary.gpPct < 8 ? "red" : summary.gpPct < 11 ? "yellow" : "green", "Filtered gross profit quality"),
      quality("Lowest Model", low.name, "yellow", `${U.formatPercent(low.gpPct)} GP margin`),
      quality("Best GP Model", high.name, "green", `${U.formatPercent(high.gpPct)} GP margin`),
      quality("Mix Watch", type.name, "yellow", `${U.formatPercent(type.share)} mix share`)
    ].join(""));
  }

  function renderPipeline(summary, monthly) {
    const recent = safe(monthly.at(-1));
    const booking = Math.round(summary.units * 1.18);
    const conversion = booking ? (summary.units / booking) * 100 : 0;
    U.setHtml("bookingPipelinePanel", `
      ${scoreRow("Booking Proxy", `${booking.toLocaleString()} units`, "Estimated from current deliveries")}
      ${scoreRow("Delivery Conversion", U.formatPercent(conversion), "Proxy conversion")}
      ${scoreRow("Latest Month", `${recent.name} / ${recent.units.toLocaleString()} units`, "Current filtered trend")}`);
  }

  function renderForecastGap(summary, monthly, dealers, intel) {
    const bestMonth = safe(monthly.slice().sort((a, b) => b.units - a.units)[0]);
    const topDealer = safe(dealers[0]);
    U.setHtml("forecastGapPanel", `
      <div class="risk-meter">
        <strong>${intel.forecast.toLocaleString()}</strong>
        <span>Rule-based forecast units</span>
      </div>
      ${scoreRow("Target Baseline", `${intel.target.toLocaleString()} units`, "Static V6 placeholder")}
      ${scoreRow("Gap", `${intel.gap >= 0 ? "+" : ""}${intel.gap.toLocaleString()} units`, intel.gap < 0 ? "Needs close action" : "Above baseline")}
      ${scoreRow("Best Month", bestMonth.name, `${bestMonth.units.toLocaleString()} units`)}
      ${scoreRow("Primary Lever", topDealer.name, `${U.formatPercent(topDealer.share)} share`)}`);
  }

  function renderRiskOpportunity(intel) {
    U.setHtml("riskOpportunityPanel", [
      signal(intel.gap < 0 ? "Gap" : "Opportunity", "Forecast Focus", intel.gap < 0 ? `Recover ${Math.abs(intel.gap).toLocaleString()} units through priority dealer follow-up.` : "Forecast is above the static baseline; protect GP while closing."),
      signal("Margin", "Price Discipline", `Review lowest-margin model ${intel.lowMarginModel.name} at ${U.formatPercent(intel.lowMarginModel.gpPct)} GP.`),
      signal("Dealer", "Network Balance", `Watch ${intel.weakDealer.name} and reduce over-reliance on ${intel.topDealer.name}.`),
      signal("Product", "Push Candidate", `Prioritize ${intel.highMarginModel.name} where supply and lead quality allow.`)
    ].join(""));
  }

  function renderAlertCenter(alerts) {
    U.setHtml("alertCenter", alerts.map((item) => `
      <article class="alert-card ${item.color}">
        <span>${item.color}</span>
        <strong>${item.title}</strong>
        <p>${item.text}</p>
      </article>`).join(""));
  }

  function renderCards(targetId, rows, href, label) {
    U.setHtml(targetId, rows.map((row) => `
      <a href="${href}" class="drill-card">
        <span>${label}</span>
        <strong>${row.name}</strong>
        <small>${row.units.toLocaleString()} units | ${U.formatPercent(row.share)} share | GP ${U.formatPercent(row.gpPct)}</small>
      </a>`).join("") || `<div class="empty-inline">No ${label.toLowerCase()} data</div>`);
  }

  function renderExecutiveStrip(summary, groups, intel) {
    U.setText("aiSales", `${summary.units.toLocaleString()} units`);
    U.setText("aiGp", U.formatPercent(summary.gpPct));
    U.setText("healthScore", Math.min(99, Math.max(60, Math.round(summary.gpPct * 8))));
    U.setText("aiExecutiveFocus", groups.dealers[0]?.name || "-");
    U.setText("aiModelFocus", intel.highMarginModel.name || groups.models[0]?.name || "-");
  }

  function safe(row) {
    return row || { name: "-", units: 0, sales: 0, value: 0, gp: 0, gpPct: 0, share: 0 };
  }

  function alert(title, color, text) {
    return { title, color, text };
  }

  function quality(label, value, color, meta) {
    return `<article class="quality-card ${color}"><span>${label}</span><strong>${value}</strong><small>${meta}</small></article>`;
  }

  function scoreRow(label, value, meta) {
    return `
      <div class="score-row">
        <strong>${label}</strong>
        <span>${value}</span>
        <small>${meta}</small>
      </div>`;
  }

  function signal(level, title, text) {
    return `
      <div class="signal-row">
        <span class="signal-badge">${level}</span>
        <strong>${title}</strong>
        <small>${text}</small>
      </div>`;
  }

  function deepMerge(target, source) {
    const output = { ...target };
    Object.keys(source || {}).forEach((key) => {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) && !(source[key] instanceof Function)) {
        output[key] = deepMerge(output[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    });
    return output;
  }
})();
