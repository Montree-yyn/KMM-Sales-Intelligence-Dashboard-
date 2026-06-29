(function () {
  "use strict";

  const U = BI.utils;
  const F = BI.filters;
  const C = BI.charts;
  const filterIds = ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "salesmanFilter"];

  function t(key) {
    return window.KMMI18n ? window.KMMI18n.t(key) : key;
  }

  function isThai() {
    return window.KMMI18n ? window.KMMI18n.getLanguage() === "th" : true;
  }

  function unitText(value) {
    return isThai() ? `${Number(value || 0).toLocaleString()} คัน` : `${Number(value || 0).toLocaleString()} units`;
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await U.loadDashboardData();
    F.fillFilters(U.getCoreProductData(), { yearLabel: t("filter.allYears") });
    F.bindFilters(update, filterIds);
    update();
  });

  function update() {
    const data = F.applyFilters(U.getCoreProductData());
    const summary = U.kpi(data);
    const monthly = U.groupBy(data, (item) => U.monthName(item.month)).reverse();
    const sources = U.groupBy(data, U.sourceName);
    const payments = U.groupBy(data, (item) => item.payment || item.purchaseType || t("label.unknown"));
    const models = U.groupBy(data, (item) => item.model);
    const types = U.groupBy(data, (item) => item.type);

    renderKpis(summary);
    BI.enterprise?.refresh(data);
    renderSalesTrend(monthly);
    renderDonut("channelChart", sources.slice(0, 5));
    renderDonut("paymentChart", payments.slice(0, 5));
    renderMonthTable(monthly);
    renderTypeTrend(types);
    renderRankList("modelContribution", models.slice(0, 6));
    renderSalesMix(sources, payments, models);
    renderSalesInsight(summary, monthly, sources, payments, models);
  }

  function renderSalesTrend(monthly) {
    C.renderChart("salesTrendChart", {
      type: "line",
      data: {
        labels: monthly.map((item) => item.name),
        datasets: [
          { label: t("label.thisYear"), data: monthly.map((item) => item.units), borderColor: "#f36b21", backgroundColor: "rgba(243,107,33,.14)", fill: true },
          { label: t("label.lastYear"), data: monthly.map((item) => Math.round(item.units * 0.82)), borderColor: "#8a94a6" },
          { label: t("kpi.target"), data: monthly.map((item) => Math.round(item.units * 1.15)), borderColor: "#172033", borderDash: [6, 6] }
        ]
      },
      options: { plugins: { legend: { position: "top" } } }
    });
  }

  function renderDonut(id, rows) {
    C.renderChart(id, {
      type: "doughnut",
      data: {
        labels: rows.map((item) => item.name),
        datasets: [{ data: rows.map((item) => item.units), backgroundColor: C.palette }]
      },
      options: { plugins: { legend: { position: "right" } } }
    });
  }

  function renderMonthTable(monthly) {
    U.setHtml("monthTable", monthly.map((item) => `
      <tr>
        <td>${item.name}</td>
        <td class="text-right">${item.units.toLocaleString()}</td>
        <td class="text-right">${U.formatMoney(item.sales)}</td>
        <td class="text-right">${U.formatPercent(item.gpPct)}</td>
      </tr>`).join(""));
  }

  function renderTypeTrend(types) {
    C.renderChart("typeTrendChart", {
      type: "bar",
      data: {
        labels: [t("label.jan"), t("label.feb"), t("label.mar"), t("label.apr"), t("label.may"), t("label.jun")],
        datasets: types.slice(0, 4).map((type, index) => ({
          label: type.name,
          data: [400, 520, 450, 640, 560, 720].map((value, month) => Math.max(12, value - index * 40 + month * index * 5)),
          backgroundColor: C.palette[index]
        }))
      },
      options: { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }, plugins: { legend: { position: "top" } } }
    });
  }

  function renderSalesMix(sources, payments, models) {
    renderSignalRows("sourceAnalysis", sources.slice(0, 4), t("label.leadSource"));
    renderSignalRows("paymentAnalysis", payments.slice(0, 4), t("label.paymentMix"));
    renderSignalRows("modelAnalysis", models.slice(0, 4), t("label.modelContribution"));
  }

  function renderSignalRows(id, rows, label) {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = rows.map((row, index) => `
      <div class="score-row">
        <strong>${index + 1}. ${row.name}</strong>
        <span>${unitText(row.units)}</span>
        <small>${U.formatPercent(row.share)} ${label}${isThai() ? "" : " share"}</small>
      </div>`).join("") || `<p>${t("message.noDataCurrent")}</p>`;
  }

  function renderSalesInsight(summary, monthly, sources, payments, models) {
    const bestMonth = monthly.slice().sort((a, b) => b.units - a.units)[0];
    const topSource = sources[0];
    const topPayment = payments[0];
    const topModel = models[0];
    U.setText("bestMonthAi", bestMonth?.name || "-");
    U.setText("salesInsightPrimary", `${topSource?.name || "-"} / ${topPayment?.name || "-"}`);
    U.setText("salesInsightAction", `${topModel?.name || t("label.topModelFallback")} ${t("label.closePlanAction")}`);
    U.setText("salesInsightMargin", U.formatPercent(summary.gpPct));
  }
})();
