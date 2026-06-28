(function (window) {
  "use strict";

  const BI = window.BI || {};
  const state = BI.state || { data: [], charts: {} };

  const PRODUCT_TYPE_MAP = {
    TT: "Tractor (TT)",
    TRACTOR: "Tractor (TT)",
    "TRACTOR (TT)": "Tractor (TT)",
    CH: "Combine Harvester (CH)",
    COMBINE: "Combine Harvester (CH)",
    "COMBINE HARVESTER": "Combine Harvester (CH)",
    "COMBINE HARVESTER (CH)": "Combine Harvester (CH)",
    EX: "Excavator (EX)",
    EXCAVATOR: "Excavator (EX)",
    "EXCAVATOR (EX)": "Excavator (EX)",
    TP: "Transplanter (TP)",
    "POWER TILLER": "Transplanter (TP)",
    "POWER TILLER (TP)": "Transplanter (TP)",
    TRANSPLANTER: "Transplanter (TP)",
    "TRANSPLANTER (TP)": "Transplanter (TP)",
    TX: "Used Tractor (TX)",
    USED: "Used Tractor (TX)",
    "USED TRACTOR": "Used Tractor (TX)",
    "USED TRACTOR (TX)": "Used Tractor (TX)",
    IM: "Implement (IM)",
    IMPLEMENT: "Implement (IM)",
    OT: "Other (OT)",
    OTHER: "Other (OT)"
  };

  const CORE_PRODUCT_TYPES = [
    "Tractor (TT)",
    "Combine Harvester (CH)",
    "Excavator (EX)",
    "Transplanter (TP)",
    "Used Tractor (TX)"
  ];

  function number(value) {
    return Number(value || 0);
  }

  function text(value) {
    return (value ?? "").toString().trim();
  }

  function formatMoney(value) {
    const amount = number(value);
    if (Math.abs(amount) >= 1e9) return (amount / 1e9).toFixed(1) + "B";
    if (Math.abs(amount) >= 1e6) return (amount / 1e6).toFixed(1) + "M";
    if (Math.abs(amount) >= 1e3) return (amount / 1e3).toFixed(1) + "K";
    return amount.toLocaleString();
  }

  function formatPercent(value) {
    return number(value).toFixed(1) + "%";
  }

  function weekNumber(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function monthName(month) {
    return ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(month)] || month || "-";
  }

  function unique(values) {
    return [...new Set(values.filter((value) => value !== undefined && value !== null && text(value) !== ""))];
  }

  function normalizeProductType(type) {
    const key = text(type).toUpperCase();
    return PRODUCT_TYPE_MAP[key] || text(type);
  }

  function normalizeData(data) {
    return (data || []).map((item) => ({
      ...item,
      type: normalizeProductType(item.type)
    }));
  }

  async function loadDashboardData(options = {}) {
    const cacheBust = options.cacheBust === false ? "" : "?v=" + Date.now();
    const response = await fetch("data/dashboard_data.json" + cacheBust);
    const raw = await response.json();
    state.data = normalizeData(raw);
    window.dashboardData = state.data;
    window.DASHBOARD_DATA = state.data;
    console.log("Loaded records:", state.data.length);
    return state.data;
  }

  function getData() {
    return state.data || [];
  }

  function getCoreProductData(data = getData()) {
    return data.filter((item) => item && item.type && item.model && CORE_PRODUCT_TYPES.includes(item.type));
  }

  function salesmanName(item) {
    return item["Sales Staff"] || item.salesman || item.salesStaff || "Unknown";
  }

  function sourceName(item) {
    return item.source || item["Source (ที่มาลูกค้า)"] || item.Source || "Unknown";
  }

  function valueOf(item) {
    return number(item.msrp || item.salesValue);
  }

  function gpOf(item) {
    return number(item.gp1 || item.grossProfit);
  }

  function commissionOf(item) {
    return number(item.commission);
  }

  function groupBy(data, getter) {
    const map = {};
    data.forEach((item) => {
      const key = getter(item) || "Unknown";
      if (!map[key]) map[key] = { name: key, units: 0, sales: 0, value: 0, gp: 0, com: 0 };
      map[key].units += 1;
      map[key].sales += valueOf(item);
      map[key].value += valueOf(item);
      map[key].gp += gpOf(item);
      map[key].com += commissionOf(item);
    });
    return Object.values(map)
      .map((row) => ({
        ...row,
        gpPct: row.sales ? (row.gp / row.sales) * 100 : 0,
        share: data.length ? (row.units / data.length) * 100 : 0
      }))
      .sort((a, b) => b.units - a.units);
  }

  function kpi(data) {
    const units = data.length;
    const sales = data.reduce((sum, item) => sum + valueOf(item), 0);
    const gp = data.reduce((sum, item) => sum + gpOf(item), 0);
    const com = data.reduce((sum, item) => sum + commissionOf(item), 0);
    return {
      units,
      sales,
      value: sales,
      salesValue: sales,
      gp,
      grossProfit: gp,
      com,
      gpPct: sales ? (gp / sales) * 100 : 0,
      gpPercent: sales ? (gp / sales) * 100 : 0,
      averagePrice: units ? sales / units : 0,
      avg: units ? sales / units : 0
    };
  }

  function setHtml(id, value) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = value;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function lastRefresh() {
    const now = new Date();
    return now.toLocaleDateString("en-GB") + " " + now.toLocaleTimeString("en-GB");
  }

  BI.state = state;
  BI.types = { PRODUCT_TYPE_MAP, CORE_PRODUCT_TYPES };
  BI.utils = {
    number,
    text,
    formatMoney,
    formatPercent,
    weekNumber,
    monthName,
    unique,
    normalizeProductType,
    normalizeData,
    loadDashboardData,
    getData,
    getCoreProductData,
    salesmanName,
    sourceName,
    valueOf,
    gpOf,
    commissionOf,
    groupBy,
    kpi,
    setHtml,
    setText,
    lastRefresh
  };

  window.BI = BI;
})(window);
