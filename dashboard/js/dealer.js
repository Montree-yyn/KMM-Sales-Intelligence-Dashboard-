(function () {
  "use strict";

  const U = BI.utils;
  const F = BI.filters;
  const C = BI.charts;
  const ids = ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "typeFilter"];

  window.addEventListener("DOMContentLoaded", async () => {
    await U.loadDashboardData();
    F.fillFilters(U.getCoreProductData(), { includeType: true, yearLabel: "All years" });
    F.bindFilters(update, ids);
    update();
  });

  function data() {
    return F.applyFilters(U.getCoreProductData());
  }

  function update() {
    const rows = data();
    const dealers = U.groupBy(rows, (item) => item.dealer);
    U.setText("lastRefresh", U.lastRefresh());
    U.setText("dealerCountTop", dealers.length);
    U.setText("bestDealerTop", dealers[0]?.name || "-");
    U.setText("kpiDealers", dealers.length);
    U.setText("kpiSales", rows.length.toLocaleString());
    U.setText("kpiGP", U.formatMoney(rows.reduce((sum, item) => sum + U.gpOf(item), 0)));
    BI.enterprise?.refresh(rows);

    renderList("dealerRankingList", dealers);
    renderRadar(dealers);
    renderFunnel();
    renderHealth(dealers);
    renderStockAge();
    renderCollections();
    renderCoverage(dealers);

    U.setText("aiBestDealer", dealers[0]?.name || "-");
    U.setText("aiWarningDealer", dealers.at(-1)?.name || "-");
    U.setText("aiStockAction", "Balance Stock");
    U.setText("aiDealerAction", "Focus Top Dealer");
  }

  function renderList(id, rows) {
    const target = document.getElementById(id);
    if (!target) return;
    const max = rows[0]?.units || 1;
    target.innerHTML = rows.map((row, index) => `
      <div class="clean-item">
        <div class="clean-rank">${index + 1}</div>
        <div>
          <div class="clean-name">${row.name}</div>
          <div class="clean-meta">${row.units} units | GP ${U.formatPercent(row.gpPct)} | ${U.formatMoney(row.value)}</div>
          <div class="clean-bar"><div class="clean-fill" style="width:${(row.units / max) * 100}%"></div></div>
        </div>
        <div class="clean-value">${row.units}</div>
      </div>`).join("") || "<p>No data</p>";
  }

  function renderRadar(rows) {
    C.renderChart("dealerRadarChart", {
      type: "radar",
      data: {
        labels: ["Sales", "Stock", "Service", "Customer", "Training"],
        datasets: rows.slice(0, 3).map((row, index) => ({
          label: row.name,
          data: [row.units % 100, 60 + index * 10, 70 - index * 8, 65 + index * 7, 55 + index * 12],
          borderColor: C.palette[index],
          backgroundColor: ["rgba(255,90,0,.12)", "rgba(18,184,157,.12)", "rgba(154,163,175,.12)"][index]
        }))
      },
      options: { scales: { r: { beginAtZero: true, max: 100 } }, plugins: { legend: { position: "right" } } }
    });
  }

  function renderFunnel() {
    const target = document.getElementById("dealerFunnel");
    if (!target) return;
    target.innerHTML = ["Lead|4,852", "Quotation|2,986", "Booking|1,986", "Delivery|2,842"].map((row) => {
      const [label, value] = row.split("|");
      return `<div class="funnel-step"><span>${label}</span><strong>${value}</strong></div>`;
    }).join("");
  }

  function renderHealth(rows) {
    const target = document.getElementById("dealerHealth");
    if (!target) return;
    target.innerHTML = rows.slice(0, 4).map((row, index) => `<div class="score-row"><strong>${row.name}</strong><span class="status ${index === 0 ? "good" : index === 1 ? "warn" : "bad"}">${index === 0 ? "Healthy" : index === 1 ? "Warning" : "Critical"}</span></div>`).join("");
  }

  function renderCollections() {
    U.setHtml("collectionList", '<div class="score-row"><strong>Outstanding</strong><span>22.6M MMK</span></div><div class="score-row"><strong>Overdue</strong><span>3.2M MMK</span></div><div class="score-row"><strong>Collection Rate</strong><span>92.4%</span></div>');
  }

  function renderCoverage(rows) {
    const target = document.getElementById("coverageList");
    if (!target) return;
    target.innerHTML = rows.slice(0, 4).map((row, index) => `<div class="score-row"><strong>${row.name}</strong><span>${68 + index * 5}%</span></div>`).join("");
  }

  function renderStockAge() {
    C.renderChart("dealerStockAgeChart", {
      type: "doughnut",
      data: {
        labels: ["0-30", "31-60", "61-90", "90+"],
        datasets: [{ data: [66, 54, 40, 26], backgroundColor: ["#9aa3af", "#ffb000", "#ff7a18", "#ff5a00"] }]
      }
    });
  }
})();
