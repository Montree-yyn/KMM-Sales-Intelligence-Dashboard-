(function (window) {
  "use strict";

  const BI = window.BI || {};
  const utils = BI.utils;

  const DEFAULT_FILTERS = ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "salesmanFilter"];

  function t(key) {
    return window.KMMI18n ? window.KMMI18n.t(key) : key;
  }

  function fillSelect(id, values, label, formatter) {
    const element = document.getElementById(id);
    if (!element) return;

    element.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = label;
    element.appendChild(empty);

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = formatter ? formatter(value) : value;
      element.appendChild(option);
    });
  }

  function fillFilters(data, options = {}) {
    const includeType = Boolean(document.getElementById("typeFilter")) || options.includeType;
    fillSelect("yearFilter", utils.unique(data.map((item) => item.year)).sort(), options.yearLabel || t("filter.thisYear"));
    fillSelect("monthFilter", utils.unique(data.map((item) => item.month)).sort((a, b) => utils.number(a) - utils.number(b)), options.monthLabel || t("filter.allMonths"), utils.monthName);
    fillSelect("weekFilter", utils.unique(data.map((item) => item.week)).sort((a, b) => utils.weekNumber(a) - utils.weekNumber(b)), options.weekLabel || t("filter.allWeeks"), (value) => "W" + String(utils.weekNumber(value)).padStart(2, "0"));
    fillSelect("dealerFilter", utils.unique(data.map((item) => item.dealer)).sort(), options.dealerLabel || t("filter.allDealers"));
    fillSelect("salesmanFilter", utils.unique(data.map(utils.salesmanName)).sort(), options.salesmanLabel || t("filter.allSalesmen"));
    if (includeType) fillSelect("typeFilter", utils.unique(data.map((item) => item.type)).sort(), options.typeLabel || t("filter.allTypes"));
  }

  function getFilterValues() {
    return {
      year: document.getElementById("yearFilter")?.value || "",
      month: document.getElementById("monthFilter")?.value || "",
      week: document.getElementById("weekFilter")?.value || "",
      dealer: document.getElementById("dealerFilter")?.value || "",
      salesman: document.getElementById("salesmanFilter")?.value || "",
      type: document.getElementById("typeFilter")?.value || "",
      scenario: document.getElementById("scenarioFilter")?.value || ""
    };
  }

  function applyFilters(data = utils.getCoreProductData(), values = getFilterValues()) {
    return data.filter((item) => {
      const matchYear = !values.year || String(item.year) === String(values.year);
      const matchMonth = !values.month || String(item.month) === String(values.month);
      const matchWeek = !values.week || utils.weekNumber(item.week) === utils.weekNumber(values.week);
      const matchDealer = !values.dealer || String(item.dealer) === String(values.dealer);
      const matchSalesman = !values.salesman || utils.salesmanName(item) === values.salesman;
      const matchType = !values.type || String(item.type) === String(values.type);
      return matchYear && matchMonth && matchWeek && matchDealer && matchSalesman && matchType;
    });
  }

  function resetFilters(ids = DEFAULT_FILTERS) {
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.value = "";
    });
  }

  function bindFilters(update, ids = DEFAULT_FILTERS) {
    ids.forEach((id) => document.getElementById(id)?.addEventListener("change", update));
    document.getElementById("scenarioFilter")?.addEventListener("change", update);
    document.getElementById("resetFilter")?.addEventListener("click", () => {
      resetFilters(ids);
      update();
    });
  }

  BI.filters = {
    DEFAULT_FILTERS,
    fillSelect,
    fillFilters,
    getFilterValues,
    applyFilters,
    resetFilters,
    bindFilters
  };

  window.BI = BI;
})(window);
