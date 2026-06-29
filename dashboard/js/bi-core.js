(function (window) {
  "use strict";

  const BI = window.BI || {};
  const utils = BI.utils;
  const filters = BI.filters;
  const charts = BI.charts;

  function t(key) {
    return window.KMMI18n ? window.KMMI18n.t(key) : key;
  }

  function isThai() {
    return window.KMMI18n ? window.KMMI18n.getLanguage() === "th" : true;
  }

  function unitText(value) {
    return isThai()
      ? `${Number(value || 0).toLocaleString()} คัน`
      : `${Number(value || 0).toLocaleString()} units`;
  }

  function renderKpis(summary) {
    utils.setHtml("kpiUnits", summary.units.toLocaleString());
    utils.setHtml("kpiSales", utils.formatMoney(summary.sales));
    utils.setHtml("kpiGp", utils.formatMoney(summary.gp));
    utils.setHtml("kpiGP", utils.formatMoney(summary.gp));
    utils.setHtml("kpiValue", utils.formatMoney(summary.sales));
    utils.setHtml("kpiGpPct", utils.formatPercent(summary.gpPct));
    utils.setHtml("kpiGPMargin", utils.formatPercent(summary.gpPct));
    utils.setHtml("kpiCom", utils.formatMoney(summary.com));
    utils.setHtml("kpiAvg", utils.formatMoney(summary.avg));
  }

  function renderRankList(id, rows, valueKey = "units") {
    const target = document.getElementById(id);
    if (!target) return;
    const max = rows[0]?.[valueKey] || 1;
    target.innerHTML = rows.slice(0, 6).map((row, index) => {
      const value = row[valueKey] ?? 0;
      const displayValue = typeof value.toLocaleString === "function" ? value.toLocaleString() : value;
      return `
        <div class="rank-row">
          <div class="rank-no">${index + 1}</div>
          <div>
            <div class="rank-name">${row.name}</div>
            <div class="rank-meta">${unitText(row.units)} | GP ${utils.formatPercent(row.gpPct)} | ${isThai() ? "สัดส่วน" : "Share"} ${utils.formatPercent(row.share)}</div>
            <div class="bar"><div class="fill" style="width:${(value / max) * 100}%"></div></div>
          </div>
          <div class="rank-value">${displayValue}</div>
        </div>`;
    }).join("") || `<p>${t("message.noDataCurrent")}</p>`;
  }

  function initNavigation() {
    const current = location.pathname.split("/").pop() || "executive.html";
    document.querySelectorAll(".nav-menu a").forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("active", href === current);
      link.classList.add("nav-item");
    });
  }

  document.addEventListener("DOMContentLoaded", initNavigation);

  BI.core = {
    renderKpis,
    renderRankList,
    initNavigation
  };

  window.BI = BI;

  window.DASHBOARD_DATA = BI.state.data;
  window.CHARTS = BI.state.charts;
  window.loadData = () => utils.loadDashboardData();
  window.loadDashboardData = () => utils.loadDashboardData({ cacheBust: false });
  window.coreData = () => utils.getCoreProductData();
  window.getCoreProductData = window.coreData;
  window.getRecordCount = () => utils.getData().length;
  window.getLastRefresh = utils.lastRefresh;
  window.getKPIData = (data = window.coreData()) => utils.kpi(data);
  window.formatMoney = utils.formatMoney;
  window.n = utils.number;
  window.money = utils.formatMoney;
  window.pct = utils.formatPercent;
  window.weekNo = utils.weekNumber;
  window.getWeekNo = utils.weekNumber;
  window.monthName = utils.monthName;
  window.salesmanName = utils.salesmanName;
  window.sourceName = utils.sourceName;
  window.valueOf = utils.valueOf;
  window.gpOf = utils.gpOf;
  window.comOf = utils.commissionOf;
  window.unique = utils.unique;
  window.getUniqueValues = (data, key) => utils.unique(data.map((item) => item[key]));
  window.fillSelect = filters.fillSelect;
  window.fillFilters = filters.fillFilters;
  window.filteredData = () => filters.applyFilters();
  window.getFilteredData = window.filteredData;
  window.bindFilters = filters.bindFilters;
  window.kpi = utils.kpi;
  window.group = utils.groupBy;
  window.set = utils.setHtml;
  window.chart = charts.renderChart;
  window.commonOptions = charts.commonOptions;
  window.renderKpis = renderKpis;
  window.renderRankList = renderRankList;
})(window);
