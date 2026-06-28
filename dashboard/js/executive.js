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
    const dealers = U.groupBy(data, (item) => item.dealer);
    const models = U.groupBy(data, (item) => item.model);
    const regions = U.groupBy(data, (item) => item.region);
    const monthly = monthlyRows(data);

    renderKpis(summary);
    BI.enterprise?.refresh(data);
    renderTrend(monthly);
    renderProductMix(data);
    renderRankList("regionList", regions.slice(0, 5));
    renderModelTable(models);
    renderBooking(monthly);
    renderDealerRanking(dealers);
    renderAlertCenter(summary, dealers, models);
    renderForecastRisk(summary, monthly, dealers);
    renderExecutiveSummary(summary, dealers, models);
  }

  function monthlyRows(data) {
    return U.groupBy(data, (item) => U.monthName(item.month)).reverse();
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
            backgroundColor: "rgba(243,107,33,.14)",
            fill: true
          },
          {
            label: "Sales Value (100M MMK)",
            data: monthly.map((item) => item.sales / 1e8),
            borderColor: "#172033"
          }
        ]
      },
      options: { plugins: { legend: { position: "top" } } }
    });
  }

  function renderProductMix(data) {
    const byType = U.groupBy(data, (item) => item.type).slice(0, 6);
    C.renderChart("typeChart", {
      type: "doughnut",
      data: {
        labels: byType.map((item) => item.name),
        datasets: [{ data: byType.map((item) => item.units), backgroundColor: C.palette }]
      },
      options: { plugins: { legend: { position: "right" } } }
    });
  }

  function renderModelTable(models) {
    U.setHtml("modelTable", models.slice(0, 5).map((item) => `
      <tr>
        <td>${item.name}</td>
        <td class="text-right">${item.units.toLocaleString()}</td>
        <td class="text-right">${U.formatPercent(item.share)}</td>
        <td class="text-right">${U.formatPercent(item.gpPct)}</td>
      </tr>`).join(""));
  }

  function renderBooking(monthly) {
    C.renderChart("bookingChart", {
      type: "bar",
      data: {
        labels: monthly.map((item) => item.name).slice(-6),
        datasets: [
          { label: "Booking", data: monthly.map((item) => Math.round(item.units * 1.18)).slice(-6), backgroundColor: "#f36b21" },
          { label: "Delivery", data: monthly.map((item) => item.units).slice(-6), backgroundColor: "#172033" }
        ]
      },
      options: { plugins: { legend: { position: "top" } } }
    });
  }

  function renderDealerRanking(dealers) {
    const target = document.getElementById("dealerRanking");
    if (!target) return;
    renderRankList("dealerRanking", dealers.slice(0, 6), "sales");
  }

  function renderAlertCenter(summary, dealers, models) {
    const target = document.getElementById("alertCenter");
    if (!target) return;
    const weakestDealer = dealers.at(-1)?.name || "-";
    const lowMarginModel = models.slice().sort((a, b) => a.gpPct - b.gpPct)[0]?.name || "-";
    const alerts = [
      {
        level: summary.gpPct < 8 ? "High" : "Watch",
        title: "Margin Quality",
        text: `${U.formatPercent(summary.gpPct)} GP margin across current filters`
      },
      {
        level: "Review",
        title: "Dealer Coverage",
        text: `${weakestDealer} has the lowest filtered contribution`
      },
      {
        level: "Action",
        title: "Model Mix",
        text: `${lowMarginModel} needs pricing or discount review`
      }
    ];
    target.innerHTML = alerts.map((alert) => `
      <div class="signal-row">
        <span class="signal-badge">${alert.level}</span>
        <strong>${alert.title}</strong>
        <small>${alert.text}</small>
      </div>`).join("");
  }

  function renderForecastRisk(summary, monthly, dealers) {
    const target = document.getElementById("forecastRisk");
    if (!target) return;
    const forecast = Math.round(summary.units * 1.08);
    const targetUnits = Math.max(400, Math.round(summary.units * 1.12));
    const gap = forecast - targetUnits;
    const dealerDependency = dealers[0]?.share || 0;
    target.innerHTML = `
      <div class="risk-meter">
        <strong>${forecast.toLocaleString()}</strong>
        <span>V5.1 forecast placeholder units</span>
      </div>
      <div class="score-row"><strong>Target Gap</strong><span>${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units</span></div>
      <div class="score-row"><strong>Peak Month</strong><span>${monthly.slice().sort((a, b) => b.units - a.units)[0]?.name || "-"}</span></div>
      <div class="score-row"><strong>Dealer Dependency</strong><span>${U.formatPercent(dealerDependency)}</span></div>`;
  }

  function renderExecutiveSummary(summary, dealers, models) {
    U.setText("aiSales", `${summary.units.toLocaleString()} units`);
    U.setText("aiGp", U.formatPercent(summary.gpPct));
    U.setText("healthScore", Math.min(99, Math.max(60, Math.round(summary.gpPct * 8))));
    U.setText("aiExecutiveFocus", dealers[0]?.name || "-");
    U.setText("aiModelFocus", models[0]?.name || "-");
  }
})();
