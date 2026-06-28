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

  function update() {
    const data = F.applyFilters(U.getCoreProductData());
    const summary = U.kpi(data);
    const salesmen = U.groupBy(data, U.salesmanName);
    const models = U.groupBy(data, (item) => item.model);
    const sources = U.groupBy(data, U.sourceName);
    const types = U.groupBy(data, (item) => item.type);

    renderKpis(summary);
    BI.enterprise?.refresh(data);
    renderRankList("salesmanRank", salesmen.slice(0, 6));
    renderMatrix(salesmen);
    renderAchievementTable(salesmen);
    renderAchievementChart(salesmen);
    renderFunnel(data);
    renderActivityHeatmap(salesmen);
    renderCapabilityMatrix(salesmen);
    renderProductSpecialization(types, models);
    renderLeadSource(sources);
    renderCoachingInsight(summary, salesmen, sources, models);
  }

  function renderMatrix(salesmen) {
    C.renderChart("matrixChart", {
      type: "scatter",
      data: {
        datasets: [{
          label: "Salesman",
          data: salesmen.map((item) => ({ x: item.units, y: item.gpPct, name: item.name })),
          backgroundColor: "#f36b21"
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (context) => `${context.raw.name}: ${context.raw.x} units / GP ${context.raw.y.toFixed(1)}%` } }
        }
      }
    });
  }

  function renderAchievementTable(salesmen) {
    const leaderUnits = salesmen[0]?.units || 1;
    U.setHtml("achievementTable", salesmen.slice(0, 6).map((item, index) => {
      const achievement = Math.min(128, (item.units / leaderUnits) * 100);
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${item.name}</td>
          <td class="text-right">${achievement.toFixed(1)}%</td>
        </tr>`;
    }).join(""));
  }

  function renderAchievementChart(salesmen) {
    const leaderUnits = salesmen[0]?.units || 1;
    const buckets = { ">100%": 0, "80-100%": 0, "60-80%": 0, "<60%": 0 };
    salesmen.forEach((item) => {
      const score = (item.units / leaderUnits) * 100;
      if (score >= 100) buckets[">100%"] += 1;
      else if (score >= 80) buckets["80-100%"] += 1;
      else if (score >= 60) buckets["60-80%"] += 1;
      else buckets["<60%"] += 1;
    });
    C.renderChart("achievementChart", {
      type: "doughnut",
      data: {
        labels: Object.keys(buckets),
        datasets: [{ data: Object.values(buckets), backgroundColor: ["#f36b21", "#168f72", "#b7791f", "#d6dbe3"] }]
      },
      options: { plugins: { legend: { position: "right" } } }
    });
  }

  function renderFunnel(data) {
    const deliveries = data.length;
    C.renderChart("funnelChart", {
      type: "bar",
      data: {
        labels: ["Lead", "Quotation", "Booking", "Delivery"],
        datasets: [{
          data: [deliveries * 5.4, deliveries * 2.8, deliveries * 1.6, deliveries].map(Math.round),
          backgroundColor: ["#ffc28d", "#ff9a4a", "#f36b21", "#172033"]
        }]
      },
      options: { indexAxis: "y", plugins: { legend: { display: false } } }
    });
  }

  function renderActivityHeatmap(salesmen) {
    const target = document.getElementById("activityHeatmap");
    if (!target) return;
    const rows = salesmen.slice(0, 5);
    const max = rows[0]?.units || 1;
    target.innerHTML = rows.map((item) => `
      <div class="activity-row">
        <span>${item.name}</span>
        ${Array.from({ length: 7 }).map((_, index) => {
          const intensity = 0.18 + Math.min(0.78, ((item.units / max) * (0.65 + index * 0.04)));
          return `<b style="--activity:${intensity.toFixed(2)}"></b>`;
        }).join("")}
      </div>`).join("");
  }

  function renderCapabilityMatrix(salesmen) {
    const target = document.getElementById("capabilityMatrix");
    if (!target) return;
    const leaderUnits = salesmen[0]?.units || 1;
    target.innerHTML = salesmen.slice(0, 6).map((item) => {
      const volume = Math.round((item.units / leaderUnits) * 100);
      const margin = Math.round(Math.min(100, item.gpPct * 8));
      const consistency = Math.round((volume + margin) / 2);
      return `
        <div class="capability-row">
          <strong>${item.name}</strong>
          <span style="--score:${volume}%">Volume</span>
          <span style="--score:${margin}%">Margin</span>
          <span style="--score:${consistency}%">Consistency</span>
        </div>`;
    }).join("") || "<p>No data</p>";
  }

  function renderProductSpecialization(types, models) {
    renderSpecialList("productSpecialization", types.slice(0, 5), "type share");
    renderSpecialList("salesmanModelFocus", models.slice(0, 5), "model share");
  }

  function renderLeadSource(sources) {
    renderSpecialList("leadSourceList", sources.slice(0, 5), "lead share");
  }

  function renderSpecialList(id, rows, label) {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = rows.map((item) => `
      <div class="score-row">
        <strong>${item.name}</strong>
        <span>${item.units.toLocaleString()} units</span>
        <small>${U.formatPercent(item.share)} ${label}</small>
      </div>`).join("") || "<p>No data</p>";
  }

  function renderCoachingInsight(summary, salesmen, sources, models) {
    const top = salesmen[0];
    const coach = salesmen.slice().sort((a, b) => a.gpPct - b.gpPct)[0];
    U.setText("topSalesmanAi", top?.name || "-");
    U.setText("achieveAi", top ? `${Math.min(128, top.share + 80).toFixed(1)}%` : "-");
    U.setText("coachFocus", coach?.name || "-");
    U.setText("coachAction", `${models[0]?.name || "Top model"} playbook via ${sources[0]?.name || "best lead source"}`);
    U.setText("coachMargin", U.formatPercent(summary.gpPct));
  }
})();
