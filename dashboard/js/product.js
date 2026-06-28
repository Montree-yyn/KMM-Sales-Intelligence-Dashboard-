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
    const summary = U.kpi(rows);
    const models = U.groupBy(rows, (item) => item.model);
    const types = U.groupBy(rows, (item) => item.type);

    U.setText("recordCount", rows.length.toLocaleString());
    U.setText("lastRefresh", U.lastRefresh());
    U.setText("topModelTop", models[0]?.name || "-");
    renderKpis(summary);
    renderList("topModelList", models.slice(0, 5));
    renderTrend(rows);
    renderTypeMix(types);
    renderMatrix(models);
    renderHeatmap(rows);
    renderStockAge();

    U.setText("aiTopModel", models[0]?.name || "-");
    U.setText("aiHighGP", models.slice().sort((a, b) => b.gpPct - a.gpPct)[0]?.name || "-");
    U.setText("aiRisk", models.slice().sort((a, b) => a.units - b.units)[0]?.name || "-");
    U.setText("aiRecommend", (models[0]?.name || "Top model") + " to key dealers");
  }

  function renderKpis(summary) {
    U.setText("kpiUnits", summary.units.toLocaleString());
    U.setText("kpiValue", U.formatMoney(summary.sales));
    U.setText("kpiGP", U.formatMoney(summary.gp));
    U.setText("kpiGPMargin", U.formatPercent(summary.gpPct));
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
          <div class="clean-meta">${row.units.toLocaleString()} units | GP ${U.formatPercent(row.gpPct)} | Share ${U.formatPercent(row.share)}</div>
          <div class="clean-bar"><div class="clean-fill" style="width:${(row.units / max) * 100}%"></div></div>
        </div>
        <div class="clean-value">${row.units}</div>
      </div>`).join("") || "<p>No data</p>";
  }

  function renderTrend(rows) {
    const monthly = U.groupBy(rows, (item) => U.monthName(item.month)).reverse();
    C.renderChart("productTrendChart", {
      type: "line",
      data: {
        labels: monthly.map((item) => item.name),
        datasets: [{
          label: "Units",
          data: monthly.map((item) => item.units),
          borderColor: "#ff5a00",
          backgroundColor: "rgba(255,90,0,.12)",
          fill: true
        }]
      },
      options: { plugins: { legend: { display: false } } }
    });
  }

  function renderTypeMix(rows) {
    C.renderChart("typeMixChart", {
      type: "doughnut",
      data: {
        labels: rows.map((item) => item.name),
        datasets: [{ data: rows.map((item) => item.units), backgroundColor: C.palette }]
      },
      options: { plugins: { legend: { position: "right" } } }
    });
  }

  function renderStockAge() {
    C.renderChart("stockAgeChart", {
      type: "doughnut",
      data: {
        labels: ["0-30 Days", "31-60 Days", "61-90 Days", "90+ Days"],
        datasets: [{ data: [68, 54, 38, 26], backgroundColor: ["#9aa3af", "#ffb000", "#ff7a18", "#ff5a00"] }]
      }
    });
  }

  function renderMatrix(rows) {
    const target = document.getElementById("productMatrix");
    if (!target) return;
    target.querySelectorAll(".dot").forEach((dot) => dot.remove());
    const maxUnits = Math.max(...rows.map((row) => row.units), 1);
    const maxGp = Math.max(...rows.map((row) => row.gpPct), 1);
    rows.slice(0, 8).forEach((row) => {
      const dot = document.createElement("div");
      dot.className = "dot";
      dot.title = row.name;
      dot.style.left = 20 + (row.units / maxUnits) * 70 + "%";
      dot.style.bottom = 20 + (row.gpPct / maxGp) * 70 + "%";
      target.appendChild(dot);
    });
  }

  function renderHeatmap(rows) {
    const target = document.getElementById("regionalHeatmap");
    if (!target) return;
    const models = U.groupBy(rows, (item) => item.model).slice(0, 4).map((item) => item.name);
    const dealers = U.unique(rows.map((item) => item.dealer)).slice(0, 3);
    let html = '<div class="heat-row"><div class="heat-cell heat-head">Model</div>' + dealers.map((dealer) => `<div class="heat-cell heat-head">${dealer}</div>`).join("") + '<div class="heat-cell heat-head">Total</div></div>';
    models.forEach((model) => {
      const values = dealers.map((dealer) => rows.filter((item) => item.model === model && item.dealer === dealer).length);
      const total = values.reduce((sum, value) => sum + value, 0);
      html += '<div class="heat-row"><div class="heat-cell heat-head">' + model + "</div>" + values.map((value) => `<div class="heat-cell heat-${Math.min(4, Math.max(1, Math.ceil(value / 20)))}">${value}</div>`).join("") + `<div class="heat-cell heat-4">${total}</div></div>`;
    });
    target.innerHTML = html;
  }
})();
