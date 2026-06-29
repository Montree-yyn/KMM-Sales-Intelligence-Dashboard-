(function () {
  "use strict";

  const U = BI.utils;
  const F = BI.filters;
  const C = BI.charts;
  const ids = ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "salesmanFilter", "typeFilter"];

  function t(key) {
    return window.KMMI18n ? window.KMMI18n.t(key) : key;
  }

  function isThai() {
    return window.KMMI18n ? window.KMMI18n.getLanguage() === "th" : true;
  }

  function unitText(value) {
    return isThai() ? `${Number(value || 0).toLocaleString()} คัน` : `${Number(value || 0).toLocaleString()} units`;
  }

  function monthLabels() {
    return ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].map((month) => t(`label.${month}`));
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await U.loadDashboardData();
    F.fillFilters(U.getCoreProductData(), { includeType: true, yearLabel: t("filter.allYears") });
    F.bindFilters(update, ids);
    update();
  });

  function data() {
    return F.applyFilters(U.getCoreProductData());
  }

  function update() {
    const rows = data();
    const actual = rows.length;
    const forecast = Math.max(363, Math.round(actual * 1.08));
    const target = 400;
    const gap = forecast - target;
    const value = rows.reduce((sum, item) => sum + U.valueOf(item), 0) * 1.08;

    U.setText("lastRefresh", U.lastRefresh());
    U.setText("topForecast", forecast);
    U.setText("kpiForecast", forecast);
    U.setText("kpiAch", ((forecast / target) * 100).toFixed(1) + "%");
    U.setText("kpiGap", gap);
    U.setText("kpiValue", U.formatMoney(value));
    U.setText("aiMonthForecast", unitText(57));
    U.setText("aiRevenue", "7.8B MMK");
    U.setText("aiRiskLevel", gap >= 0 ? t("label.low") : t("label.medium"));
    BI.enterprise?.refresh(rows);

    renderForecastTrend(rows);
    renderFunnel();
    renderProbability();
    renderList("regionForecastList", U.groupBy(rows, (item) => item.dealer).slice(0, 5), target);
    renderList("salesmanForecastList", U.groupBy(rows, U.salesmanName).slice(0, 5), target);
    renderProjection(rows);
  }

  function renderList(id, rows, target) {
    const element = document.getElementById(id);
    if (!element) return;
    const max = rows[0]?.units || 1;
    element.innerHTML = rows.map((row, index) => {
      const forecast = Math.round(row.units * 1.08);
      const achievement = (forecast / (target / 3)) * 100;
      return `
        <div class="clean-item">
          <div class="clean-rank">${index + 1}</div>
          <div>
            <div class="clean-name">${row.name}</div>
            <div class="clean-meta">${t("kpi.forecast")} ${forecast} | ${t("label.achievement")} ${achievement.toFixed(1)}% | ${t("label.gap")} ${forecast - Math.round(target / 3)}</div>
            <div class="clean-bar"><div class="clean-fill" style="width:${(row.units / max) * 100}%"></div></div>
          </div>
          <div class="clean-value">${forecast}</div>
        </div>`;
    }).join("") || `<p>${t("message.noDataCurrent")}</p>`;
  }

  function monthly(rows) {
    const map = {};
    rows.forEach((item) => {
      const month = U.number(item.month);
      if (month) map[month] = (map[month] || 0) + 1;
    });
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const actual = map[month] || 0;
      return {
        month,
        actual,
        forecast: Math.round(actual * 1.1) + (index > 5 ? 20 + index * 3 : 0),
        target: index > 5 ? 75 : 0
      };
    });
  }

  function renderForecastTrend(rows) {
    const values = monthly(rows);
    C.renderChart("forecastTrendChart", {
      type: "line",
      data: {
        labels: monthLabels(),
        datasets: [
          { label: t("label.actual"), data: values.map((item) => item.actual), borderColor: "#222b3f", backgroundColor: "#222b3f" },
          { label: t("kpi.forecast"), data: values.map((item) => item.forecast), borderColor: "#ff5a00", backgroundColor: "rgba(255,90,0,.12)", fill: true },
          { label: t("kpi.target"), data: values.map((item) => item.target), borderColor: "#9aa3af", borderDash: [6, 6] }
        ]
      },
      options: { plugins: { legend: { position: "top" } } }
    });
  }

  function renderFunnel() {
    const element = document.getElementById("forecastFunnel");
    if (!element) return;
    element.innerHTML = [`Lead|4,852`, `Quotation|2,986`, `Booking|1,986`, `${isThai() ? "ส่งมอบ" : "Delivery"}|2,842`].map((row) => {
      const [label, value] = row.split("|");
      return `<div class="funnel-step"><span>${label}</span><strong>${value}</strong></div>`;
    }).join("");
  }

  function renderProbability() {
    C.renderChart("probabilityChart", {
      type: "bubble",
      data: {
        datasets: [{
          label: t("label.deals"),
          data: [{ x: 5, y: 70, r: 18 }, { x: 9, y: 55, r: 15 }, { x: 14, y: 35, r: 22 }, { x: 18, y: 78, r: 12 }],
          backgroundColor: ["#c7d2fe", "#bfdbfe", "#ddd6fe", "#fed7aa"]
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: t("label.forecastValueMmk") } },
          y: { min: 0, max: 100, title: { display: true, text: t("label.probability") } }
        }
      }
    });
  }

  function renderProjection(rows) {
    const values = monthly(rows);
    C.renderChart("projectionChart", {
      type: "bar",
      data: {
        labels: monthLabels(),
        datasets: [
          { label: t("label.actual"), data: values.map((item) => item.actual), backgroundColor: "#222b3f" },
          { label: t("kpi.forecast"), data: values.map((item) => item.forecast), backgroundColor: "#ff5a00" }
        ]
      },
      options: { plugins: { legend: { position: "top" } } }
    });
  }
})();
