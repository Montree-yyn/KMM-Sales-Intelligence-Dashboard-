(function () {
  "use strict";

  const U = BI.utils;
  const F = BI.filters;
  const C = BI.charts;
  const filterIds = ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "salesmanFilter"];
  let activeCopilotQuestion = "";

  function t(key) {
    return window.KMMI18n ? window.KMMI18n.t(key) : key;
  }

  function isThai() {
    return window.KMMI18n ? window.KMMI18n.getLanguage() === "th" : true;
  }

  function unitText(value) {
    return isThai() ? `${value.toLocaleString()} คัน` : `${value.toLocaleString()} units`;
  }

  function shareText(value) {
    return isThai() ? `สัดส่วน ${U.formatPercent(value || 0)}` : `Share ${U.formatPercent(value || 0)}`;
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await U.loadDashboardData();
    F.fillFilters(U.getCoreProductData(), { yearLabel: t("message.allYears") });
    F.bindFilters(update, filterIds);
    bindCopilot();
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
    if (activeCopilotQuestion) renderCopilotAnswer(activeCopilotQuestion, data);
  }

  function bindCopilot() {
    const input = document.getElementById("copilotQuestion");
    const askButton = document.getElementById("copilotAskButton");
    const submit = () => runCopilot(input?.value || activeCopilotQuestion);

    askButton?.addEventListener("click", submit);
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    });

    document.querySelectorAll("[data-copilot-question]").forEach((button) => {
      button.addEventListener("click", () => {
        const question = button.getAttribute("data-copilot-question") || "";
        if (input) input.value = question;
        runCopilot(question);
      });
    });
  }

  function runCopilot(question) {
    const cleanQuestion = String(question || "").trim();
    activeCopilotQuestion = cleanQuestion || t("ai.currentSales");
    const input = document.getElementById("copilotQuestion");
    if (input && !cleanQuestion) input.value = activeCopilotQuestion;
    renderCopilotAnswer(activeCopilotQuestion, rows());
  }

  function renderCopilotAnswer(question, data) {
    const answer = BI.enterprise?.generateCopilotAnswer
      ? BI.enterprise.generateCopilotAnswer(data, question)
      : null;
    const target = document.getElementById("copilotAnswer");
    if (!target || !answer) return;

    target.replaceChildren();
    const lead = document.createElement("article");
    lead.className = `copilot-card lead ${answer.intent || "summary"}`;
    lead.append(
      copilotNode("span", t("ai.copilotAnswer")),
      copilotNode("strong", answer.headline || t("ai.ruleUnavailable")),
      copilotNode("p", answer.meta || t("ai.generatedLocal"))
    );
    target.appendChild(lead);

    (answer.cards || []).forEach((card) => {
      const node = document.createElement("article");
      node.className = `copilot-card ${card.type || ""}`;
      node.append(
        copilotNode("span", card.label || t("ai.insight")),
        copilotNode("strong", card.title || "-"),
        copilotNode("p", card.text || t("ai.signalUnavailable"))
      );
      target.appendChild(node);
    });
  }

  function copilotNode(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
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
            label: isThai() ? "จำนวนขาย" : "Sales Units",
            data: monthly.map((item) => item.units),
            borderColor: "#f36b21",
            backgroundColor: orangeGradient,
            fill: true,
            tension: 0.38
          },
          {
            label: isThai() ? "มูลค่ายอดขาย (100 ล้าน MMK)" : "Sales Value (100M MMK)",
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
          label: isThai() ? "จำนวนขาย" : "Units",
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
      </tr>`).join("") || `<tr><td colspan="4">${t("message.noModelData")}</td></tr>`);
  }

  function renderBooking(monthly) {
    const recent = monthly.slice(-6);
    C.renderChart("bookingChart", {
      type: "bar",
      data: {
        labels: recent.map((item) => item.name),
        datasets: [
          { label: isThai() ? "ยอดจองประมาณการ" : "Booking Proxy", data: recent.map((item) => Math.round(item.units * 1.18)), backgroundColor: "#f36b21", borderRadius: 10, borderSkipped: false },
          { label: isThai() ? "ส่งมอบ" : "Delivery", data: recent.map((item) => item.units), backgroundColor: "#172033", borderRadius: 10, borderSkipped: false }
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
    const hasBookingFields = data.some((item) => Object.keys(item).some((key) => /book|แผนงานขาย|stock/i.test(key)));
    const stockSignal = hasBookingFields
      ? (isThai() ? "แหล่งข้อมูลมีฟิลด์ลักษณะยอดจอง แผนงานขาย หรือสต็อก" : "Source contains booking, pipeline, or stock-like fields.")
      : (isThai() ? "ยังไม่พบฟิลด์สต็อกหรือยอดจองโดยตรง จึงใช้ค่าประมาณจากยอดส่งมอบ" : "No explicit stock or booking fields found; using booking proxy.");
    const marginSignal = summary.gpPct < 8
      ? (isThai() ? "แรงกดดันกำไร" : "margin pressure")
      : summary.gpPct < 11 ? (isThai() ? "ต้องติดตามกำไร" : "margin watch") : (isThai() ? "กำไรมั่นคง" : "stable margin");
    const forecastSignal = gapRisk
      ? (isThai() ? `ต่ำกว่าฐานเป้าหมาย ${unitText(Math.abs(gap))}` : `${Math.abs(gap).toLocaleString()} units below baseline`)
      : (isThai() ? `สูงกว่าฐานเป้าหมาย ${unitText(gap)}` : `${gap.toLocaleString()} units above baseline`);

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
      topSignal: data.length
        ? (isThai() ? `ส่งมอบแล้ว ${unitText(summary.units)} โดย ${topDealer.name} นำผลงานสาขา, ${topModel.name} เป็นรุ่นหลัก, GP อยู่ที่ ${U.formatPercent(summary.gpPct)} (${marginSignal}) และคาดการณ์ ${forecastSignal}` : `${summary.units.toLocaleString()} units delivered; ${topDealer.name} leads dealers, ${topModel.name} leads products, GP is ${U.formatPercent(summary.gpPct)} (${marginSignal}), and forecast is ${forecastSignal}.`)
        : t("message.noRecordsInsight"),
      mainRisk: gpRisk ? (isThai() ? `GP margin อยู่ที่ ${U.formatPercent(summary.gpPct)}` : `GP margin is ${U.formatPercent(summary.gpPct)}`) : concentrationRisk ? (isThai() ? `${topDealer.name} มีสัดส่วน ${U.formatPercent(topDealer.share)}` : `${topDealer.name} holds ${U.formatPercent(topDealer.share)} share`) : gapRisk ? (isThai() ? `ส่วนต่างคาดการณ์ ${unitText(Math.abs(gap))}` : `${Math.abs(gap).toLocaleString()} unit forecast gap`) : t("message.noRedRisk"),
      recommendedAction: data.length ? recommendedAction(gpRisk, concentrationRisk, gapRisk, lowMarginModel, weakDealer, topModel) : (isThai() ? "ขยายตัวกรองเพื่อให้มุมมองผู้บริหารกลับมาครบถ้วน" : "Broaden filters to restore executive coverage."),
      alerts: [
        alert(isThai() ? "ความเสี่ยง GP" : "GP Risk", gpRisk ? "red" : summary.gpPct < 11 ? "yellow" : "green", isThai() ? `GP margin ${U.formatPercent(summary.gpPct)} รุ่นต่ำสุด: ${lowMarginModel.name}` : `${U.formatPercent(summary.gpPct)} GP margin. Lowest model: ${lowMarginModel.name}.`),
        alert(isThai() ? "การกระจุกตัวของสาขา" : "Dealer Concentration", concentrationRisk ? "red" : topDealer.share > 30 ? "yellow" : "green", isThai() ? `${topDealer.name} คิดเป็น ${U.formatPercent(topDealer.share)} ของจำนวนขายตามตัวกรอง` : `${topDealer.name} contributes ${U.formatPercent(topDealer.share)} of filtered units.`),
        alert(isThai() ? "ส่วนต่างคาดการณ์" : "Forecast Gap", gapRisk ? "yellow" : "green", isThai() ? `${gap >= 0 ? "+" : ""}${unitText(gap)} เทียบฐานเป้าหมาย ${target.toLocaleString()} คัน` : `${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units vs ${target.toLocaleString()} static baseline.`),
        alert(isThai() ? "สต็อก / Booking" : "Stock / Booking", hasBookingFields ? "green" : "yellow", stockSignal)
      ]
    };
  }

  function recommendedAction(gpRisk, concentrationRisk, gapRisk, lowMarginModel, weakDealer, topModel) {
    if (gpRisk) return isThai() ? `ปกป้องกำไรก่อน: ทบทวนส่วนลดและเศรษฐศาสตร์ดีลของ ${lowMarginModel.name}` : `Protect margin first: review discounting and deal economics on ${lowMarginModel.name}.`;
    if (concentrationRisk) return isThai() ? `ลดการพึ่งพาเครือข่าย: เพิ่มกิจกรรมและติดตามสต็อกของ ${weakDealer.name}` : `Reduce network dependency: lift activity and stock follow-up for ${weakDealer.name}.`;
    if (gapRisk) return isThai() ? `ปิดส่วนต่างด้วยดีลที่มีโอกาสสูง โดยใช้ ${topModel.name} เป็นตัวนำ` : `Close the gap through high-probability deals led by ${topModel.name}.`;
    return isThai() ? `รักษาจังหวะการปิดการขายและทำให้ความพร้อมของ ${topModel.name} ชัดเจนในสาขาสำคัญ` : `Sustain close rhythm and keep ${topModel.name} availability visible across priority dealers.`;
  }

  function renderBriefing(intel) {
    U.setText("briefTopSignal", intel.topSignal);
    U.setText("briefRecommendedAction", intel.recommendedAction);
    U.setText("briefMainRisk", intel.mainRisk);
    U.setText("briefDealerWatch", intel.weakDealer.name);
    U.setText("briefProductPush", intel.highMarginModel.name || intel.topModel.name);
    U.setText("briefSalesmanSignal", intel.topSalesman.name);
    U.setHtml("briefSignalChips", [
      isThai() ? `คาดการณ์ ${unitText(intel.forecast)}` : `${intel.forecast.toLocaleString()} forecast units`,
      isThai() ? `ส่วนต่างเป้าหมาย ${intel.gap >= 0 ? "+" : ""}${unitText(intel.gap)}` : `${intel.gap >= 0 ? "+" : ""}${intel.gap.toLocaleString()} target gap`,
      isThai() ? `สาขาหลัก ${U.formatPercent(intel.topDealer.share)}` : `${U.formatPercent(intel.topDealer.share)} top dealer share`
    ].map((chip) => `<span class="command-chip">${chip}</span>`).join(""));
  }

  function renderMarginQuality(summary, models, types) {
    const low = safe(models.slice().sort((a, b) => a.gpPct - b.gpPct)[0]);
    const high = safe(models.slice().sort((a, b) => b.gpPct - a.gpPct)[0]);
    const type = safe(types.slice().sort((a, b) => a.gpPct - b.gpPct)[0]);
    U.setHtml("marginQualityPanel", [
      quality(t("kpi.gpMargin"), U.formatPercent(summary.gpPct), summary.gpPct < 8 ? "red" : summary.gpPct < 11 ? "yellow" : "green", isThai() ? "คุณภาพกำไรขั้นต้นตามตัวกรอง" : "Filtered gross profit quality"),
      quality(isThai() ? "รุ่น GP ต่ำสุด" : "Lowest Model", low.name, "yellow", `${U.formatPercent(low.gpPct)} ${t("kpi.gpMargin")}`),
      quality(isThai() ? "รุ่น GP ดีสุด" : "Best GP Model", high.name, "green", `${U.formatPercent(high.gpPct)} ${t("kpi.gpMargin")}`),
      quality(isThai() ? "ติดตามสัดส่วนสินค้า" : "Mix Watch", type.name, "yellow", isThai() ? `สัดส่วน ${U.formatPercent(type.share)}` : `${U.formatPercent(type.share)} mix share`)
    ].join(""));
  }

  function renderPipeline(summary, monthly) {
    const recent = safe(monthly.at(-1));
    const booking = Math.round(summary.units * 1.18);
    const conversion = booking ? (summary.units / booking) * 100 : 0;
    U.setHtml("bookingPipelinePanel", `
      ${scoreRow(isThai() ? "Booking Proxy" : "Booking Proxy", unitText(booking), isThai() ? "ประมาณจากยอดส่งมอบปัจจุบัน" : "Estimated from current deliveries")}
      ${scoreRow(isThai() ? "Conversion การส่งมอบ" : "Delivery Conversion", U.formatPercent(conversion), isThai() ? "Conversion แบบ Proxy" : "Proxy conversion")}
      ${scoreRow(isThai() ? "เดือนล่าสุด" : "Latest Month", `${recent.name} / ${unitText(recent.units)}`, isThai() ? "แนวโน้มตามตัวกรองปัจจุบัน" : "Current filtered trend")}`);
  }

  function renderForecastGap(summary, monthly, dealers, intel) {
    const bestMonth = safe(monthly.slice().sort((a, b) => b.units - a.units)[0]);
    const topDealer = safe(dealers[0]);
    U.setHtml("forecastGapPanel", `
      <div class="risk-meter">
        <strong>${intel.forecast.toLocaleString()}</strong>
        <span>${t("label.ruleBasedForecastUnits")}</span>
      </div>
      ${scoreRow(t("label.targetBaseline"), unitText(intel.target), isThai() ? "ฐานเป้าหมายแบบคงที่สำหรับ V11" : "Static V11 planning baseline")}
      ${scoreRow(t("label.gap"), `${intel.gap >= 0 ? "+" : ""}${unitText(intel.gap)}`, intel.gap < 0 ? (isThai() ? "ต้องเร่งปิดการขาย" : "Needs close action") : (isThai() ? "สูงกว่าฐานเป้าหมาย" : "Above baseline"))}
      ${scoreRow(t("label.bestMonth"), bestMonth.name, unitText(bestMonth.units))}
      ${scoreRow(t("label.primaryLever"), topDealer.name, isThai() ? `สัดส่วน ${U.formatPercent(topDealer.share)}` : `${U.formatPercent(topDealer.share)} share`)}`);
  }

  function renderRiskOpportunity(intel) {
    U.setHtml("riskOpportunityPanel", [
      signal(intel.gap < 0 ? t("label.gap") : t("label.opportunity"), isThai() ? "โฟกัสคาดการณ์" : "Forecast Focus", intel.gap < 0 ? (isThai() ? `กู้คืน ${unitText(Math.abs(intel.gap))} ผ่านการติดตามสาขาสำคัญ` : `Recover ${Math.abs(intel.gap).toLocaleString()} units through priority dealer follow-up.`) : (isThai() ? "คาดการณ์สูงกว่าฐานเป้าหมายแบบคงที่ ให้ปกป้อง GP ระหว่างปิดการขาย" : "Forecast is above the static baseline; protect GP while closing.")),
      signal(isThai() ? "กำไร" : "Margin", t("label.priceDiscipline"), isThai() ? `ทบทวนรุ่น GP ต่ำสุด ${intel.lowMarginModel.name} ที่ ${U.formatPercent(intel.lowMarginModel.gpPct)}` : `Review lowest-margin model ${intel.lowMarginModel.name} at ${U.formatPercent(intel.lowMarginModel.gpPct)} GP.`),
      signal(isThai() ? "สาขา" : "Dealer", t("label.networkBalance"), isThai() ? `ติดตาม ${intel.weakDealer.name} และลดการพึ่งพา ${intel.topDealer.name}` : `Watch ${intel.weakDealer.name} and reduce over-reliance on ${intel.topDealer.name}.`),
      signal(isThai() ? "สินค้า" : "Product", t("label.pushCandidate"), isThai() ? `ให้ความสำคัญกับ ${intel.highMarginModel.name} เมื่อสต็อกและคุณภาพ lead พร้อม` : `Prioritize ${intel.highMarginModel.name} where supply and lead quality allow.`)
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
    const translatedLabel = label === "Dealer" ? t("filter.dealer") : t("label.productType");
    U.setHtml(targetId, rows.map((row) => `
      <a href="${href}" class="drill-card">
        <span>${translatedLabel}</span>
        <strong>${row.name}</strong>
        <small>${unitText(row.units)} | ${isThai() ? "สัดส่วน" : "share"} ${U.formatPercent(row.share)} | GP ${U.formatPercent(row.gpPct)}</small>
      </a>`).join("") || `<div class="empty-inline">${label === "Dealer" ? t("message.noDealerData") : t("message.noProductData")}</div>`);
  }

  function renderExecutiveStrip(summary, groups, intel) {
    U.setText("aiSales", unitText(summary.units));
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
