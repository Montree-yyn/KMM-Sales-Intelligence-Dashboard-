(function (window, document) {
  "use strict";

  const C = window.V16Components;
  const Charts = window.V16Charts;
  const LANG_CODES = ["en", "th", "my"];
  const V16Lang = window.V16Lang = window.V16Lang || {
    code: localStorage.getItem("kmm-v16-language") || "en",
    dict: {},
    t(key, defaultText) {
      return this.dict?.[key] || defaultText || key;
    }
  };

  const NAV_ITEMS = [
    { key: "focus", href: "focus.html", icon: "focus", label: "Focus" },
    { key: "sales", href: "sales.html", icon: "sales", label: "Sales" },
    { key: "market", href: "market.html", icon: "market", label: "Market" },
    { key: "stock", href: "stock.html", icon: "stock", label: "Stock" },
    { key: "team", href: "team.html", icon: "team", label: "Team" },
    { key: "reports", href: "reports.html", icon: "reports", label: "Reports" },
    { key: "settings", href: "settings.html", icon: "settings", label: "Settings" }
  ];

  const PAGE_META = {
    focus: ["page.focus.title", "Focus Dashboard", "page.focus.subtitle", "Executive Command Center"],
    sales: ["page.sales.title", "Sales Dashboard", "page.sales.subtitle", "Sales Performance Analysis"],
    market: ["page.market.title", "Market Dashboard", "page.market.subtitle", "Sales Opportunity"],
    stock: ["page.stock.title", "Stock Dashboard", "page.stock.subtitle", "Product readiness"],
    team: ["page.team.title", "Team Dashboard", "page.team.subtitle", "Sales team performance"],
    reports: ["page.reports.title", "Reports Dashboard", "page.reports.subtitle", "Report center"],
    settings: ["page.settings.title", "Settings", "page.settings.subtitle", "Enterprise Administration Center"]
  };

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const state = {
    page: document.body.dataset.v16Page || "focus",
    rows: [],
    filtered: [],
    filters: {
      company: "KMM",
      branch: "all",
      dealer: "all",
      salesperson: "all",
      productType: "all",
      model: "all",
      year: "all",
      quarter: "all",
      month: "all",
      week: "all",
      dateRange: "all",
      comparePeriod: "none"
    },
    search: ""
  };

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function num(value) {
    return Number(value) || 0;
  }

  function fmt(value) {
    return Math.round(num(value)).toLocaleString("en-US");
  }

  function fmtOrNA(value, formatter = fmt) {
    return Number.isFinite(Number(value)) ? formatter(value) : C.t("common.dataNotAvailable", "Data not available");
  }

  function fmtMoney(value) {
    const amount = num(value);
    if (Math.abs(amount) >= 1000000000) return `${Math.round(amount / 1000000000)}B`;
    if (Math.abs(amount) >= 1000000) return `${Math.round(amount / 1000000)}M`;
    return fmt(amount);
  }

  function pct(value, target) {
    return target ? Math.round((num(value) / num(target)) * 1000) / 10 : 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, num(value)));
  }

  function sum(rows, key) {
    return rows.reduce((total, row) => total + num(row[key]), 0);
  }

  function unique(rows, key) {
    return Array.from(new Set(rows.map(row => row[key]).filter(Boolean))).sort((a, b) => {
      const aText = String(a);
      const bText = String(b);
      const aNumber = Number(aText.match(/\d+/)?.[0]);
      const bNumber = Number(bText.match(/\d+/)?.[0]);
      if (Number.isFinite(aNumber) && Number.isFinite(bNumber) && aNumber !== bNumber) return aNumber - bNumber;
      return aText.localeCompare(bText);
    });
  }

  function quarterOf(row) {
    return `Q${Math.ceil(num(row.month) / 3) || 1}`;
  }

  function group(rows, key, valueKey) {
    const map = new Map();
    rows.forEach(row => {
      const label = row[key] || "Unknown";
      const value = valueKey ? num(row[valueKey]) : 1;
      map.set(label, (map.get(label) || 0) + value);
    });
    return Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }

  function topGroups(rows, key, limit = 6, valueKey) {
    return group(rows, key, valueKey).slice(0, limit);
  }

  function staffRows(rows) {
    return topGroups(rows, "Sales Staff", 8).map(item => {
      const ownedRows = rows.filter(row => row["Sales Staff"] === item.label);
      const revenue = sum(ownedRows, "netReceived");
      const gp = sum(ownedRows, "gp1");
      const dealers = group(ownedRows, "dealer").length;
      const margin = revenue ? (gp / revenue) * 100 : null;
      return Object.assign({}, item, {
        rows: ownedRows,
        revenue,
        gp,
        dealers,
        margin,
        health: Math.round(Math.min(96, (item.value * 7) + Math.max(0, margin || 0) * 2 + dealers * 4))
      });
    });
  }

  function statusFor(value) {
    if (value >= 88) return "good";
    if (value >= 68) return "watch";
    return "risk";
  }

  function options(values, allLabel) {
    return [`<option value="all">${C.escapeHtml(allLabel)}</option>`]
      .concat(values.map(value => `<option value="${C.escapeHtml(value)}">${C.escapeHtml(value)}</option>`))
      .join("");
  }

  function companyOptions() {
    return [
      `<option value="KMM">KUBOTA MAESOD MYANMAR</option>`,
      `<option value="KM">KUBOTA MAESOD</option>`
    ].join("");
  }

  function dateOptions() {
    return [
      ["mtd", "17 Jun 2026"],
      ["qtd", "This Quarter"],
      ["ytd", "This Year"],
      ["all", "All Data"]
    ].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  }

  function compareOptions() {
    return [
      ["none", C.t("compare.none", "No Compare")],
      ["previousPeriod", C.t("compare.previousPeriod", "Previous Period")],
      ["previousYear", C.t("compare.previousYear", "Previous Year")]
    ].map(([value, label]) => `<option value="${value}">${C.escapeHtml(label)}</option>`).join("");
  }

  function rowsForFilterOptions(key) {
    return state.rows.filter(row => {
      if (key !== "dealer" && state.filters.dealer !== "all" && row.dealer !== state.filters.dealer) return false;
      if ((key === "month" || key === "week") && state.filters.year !== "all" && String(row.year) !== String(state.filters.year)) return false;
      if (key === "week" && state.filters.month !== "all" && String(row.month) !== String(state.filters.month)) return false;
      if (state.page === "sales") {
        if (key !== "salesperson" && state.filters.salesperson !== "all" && row["Sales Staff"] !== state.filters.salesperson) return false;
        if (key !== "productType" && state.filters.productType !== "all" && row.type !== state.filters.productType) return false;
        if (key !== "model" && state.filters.model !== "all" && row.model !== state.filters.model) return false;
      }
      return true;
    });
  }

  function populateFilters() {
    const sets = {
      company: companyOptions(),
      branch: options(unique(state.rows, "region"), C.t("filter.all", "All")),
      dealer: options(unique(rowsForFilterOptions("dealer"), "dealer"), C.t("filter.all", "All")),
      salesperson: options(unique(rowsForFilterOptions("salesperson"), "Sales Staff"), C.t("filter.all", "All")),
      productType: options(unique(rowsForFilterOptions("productType"), "type"), C.t("filter.all", "All")),
      model: options(unique(rowsForFilterOptions("model"), "model"), C.t("filter.all", "All")),
      year: options(unique(state.rows, "year"), C.t("filter.all", "All")),
      quarter: options(["Q1", "Q2", "Q3", "Q4"], C.t("filter.all", "All")),
      month: options(unique(rowsForFilterOptions("month"), "month"), C.t("filter.all", "All")),
      week: options(unique(rowsForFilterOptions("week"), "week"), C.t("filter.all", "All")),
      dateRange: dateOptions(),
      comparePeriod: compareOptions()
    };
    Object.keys(sets).forEach(key => {
      $all(`[data-filter="${key}"]`).forEach(select => {
        select.innerHTML = sets[key];
        const desiredValue = state.filters[key] || "all";
        select.value = Array.from(select.options).some(option => option.value === String(desiredValue)) ? desiredValue : "all";
        state.filters[key] = select.value;
      });
    });
  }

  function selectedRows() {
    if (!state.rows.length) return [];
    const latestYear = Math.max(...state.rows.map(row => num(row.year)));
    const latestMonth = Math.max(...state.rows.filter(row => num(row.year) === latestYear).map(row => num(row.month)));

    return state.rows.filter(row => {
      if (state.filters.branch !== "all" && row.region !== state.filters.branch) return false;
      if (state.filters.dealer !== "all" && row.dealer !== state.filters.dealer) return false;
      if (state.filters.salesperson !== "all" && row["Sales Staff"] !== state.filters.salesperson) return false;
      if (state.filters.productType !== "all" && row.type !== state.filters.productType) return false;
      if (state.filters.model !== "all" && row.model !== state.filters.model) return false;
      if (state.filters.year !== "all" && String(row.year) !== String(state.filters.year)) return false;
      if (state.filters.quarter !== "all" && quarterOf(row) !== state.filters.quarter) return false;
      if (state.filters.month !== "all" && String(row.month) !== String(state.filters.month)) return false;
      if (state.filters.week !== "all" && String(row.week) !== String(state.filters.week)) return false;
      if (state.search) {
        const haystack = [row.dealer, row["Sales Staff"], row.region, row.type, row.model, row.ref].join(" ").toLowerCase();
        if (!haystack.includes(state.search)) return false;
      }
      if (state.filters.dateRange === "mtd") return num(row.year) === latestYear && num(row.month) === latestMonth;
      if (state.filters.dateRange === "qtd") return num(row.year) === latestYear && num(row.month) >= Math.max(1, latestMonth - 2);
      if (state.filters.dateRange === "ytd") return num(row.year) === latestYear;
      return true;
    });
  }

  function healthScore(rows) {
    const units = rows.length;
    if (!units) return 0;
    const revenue = sum(rows, "netReceived");
    const margin = revenue ? (sum(rows, "gp1") / revenue) * 100 : 0;
    const dealerBreadth = group(rows, "dealer").length;
    const unitScore = units >= 24 ? 92 : units >= 16 ? 84 : units >= 10 ? 74 : 58;
    const marginScore = margin >= 10 ? 94 : margin >= 7 ? 82 : margin >= 4 ? 68 : 52;
    const breadthScore = dealerBreadth >= 6 ? 92 : dealerBreadth >= 4 ? 80 : 64;
    const score = Math.round(unitScore * 0.45 + marginScore * 0.35 + breadthScore * 0.2);
    return units >= 24 ? Math.max(score, 92) : score;
  }

  function kpiData(rows) {
    if (!rows.length) {
      return [
        ["cart", "Sales (Units)", "Current filter"],
        ["collection", "Sales Value (MMK)", "Bound to netReceived"],
        ["forecast", "Gross Profit (MMK)", "Bound to gp1"],
        ["health", "GP Margin", "Profit quality"],
        ["market", "Active Dealers", "Dealer breadth"],
        ["stock", "Active Models", "Product mix"],
        ["team", "Salespeople", "Team coverage"]
      ].map(([icon, title, meta]) => ({
        icon,
        title,
        valueText: "Data not available",
        targetText: "Data not available",
        achievementText: "Achievement: Data not available",
        meta,
        status: "risk",
        sparkline: []
      }));
    }
    const units = rows.length;
    const revenue = sum(rows, "netReceived");
    const gp = sum(rows, "gp1");
    const margin = revenue ? (gp / revenue) * 100 : null;
    const health = healthScore(rows);
    const dealerCount = group(rows, "dealer").length;
    const modelCount = group(rows, "model").length;
    const staffCount = group(rows, "Sales Staff").length;
    const spark = monthlySeries(rows).map(item => item.sales);
    const sparkMax = Math.max(...spark, 1);
    const sparkline = spark.map(value => Math.round((value / sparkMax) * 100));
    const items = [
      { icon: "cart", title: "Sales (Units)", value: units, valueText: fmtOrNA(units), meta: "Current filter", status: units ? "good" : "risk" },
      { icon: "collection", title: "Sales Value (MMK)", value: revenue, valueText: fmtOrNA(revenue, fmtMoney), meta: "Bound to netReceived", status: revenue ? "good" : "risk" },
      { icon: "forecast", title: "Gross Profit (MMK)", value: gp, valueText: fmtOrNA(gp, fmtMoney), meta: "Bound to gp1", status: gp > 0 ? "good" : "risk" },
      { icon: "health", title: "GP Margin", value: margin, valueText: margin === null ? "Data not available" : `${Math.round(margin * 10) / 10}%`, meta: "Profit quality", status: margin >= 8 ? "good" : margin >= 4 ? "watch" : "risk" },
      { icon: "market", title: "Active Dealers", value: dealerCount, valueText: fmtOrNA(dealerCount), meta: "Dealer breadth", status: dealerCount ? "good" : "risk" },
      { icon: "stock", title: "Active Models", value: modelCount, valueText: fmtOrNA(modelCount), meta: "Product mix", status: modelCount ? "good" : "risk" },
      { icon: "team", title: "Salespeople", value: staffCount, valueText: fmtOrNA(staffCount), meta: "Team coverage", status: staffCount ? "good" : "risk" }
    ];

    return items.map(item => {
      const achievement = Number.isFinite(Number(item.target)) ? pct(item.value, item.target) : null;
      return Object.assign({}, item, {
        targetText: "Data not available",
        achievement,
        achievementText: achievement === null ? "Achievement: Data not available" : `${achievement}%`,
        sparkline
      });
    });
  }

  function mission(rows) {
    const dealer = group(rows, "dealer")[0]?.label || "Data not available";
    const model = group(rows, "model")[0]?.label || "Data not available";
    const progress = rows.length ? Math.min(100, healthScore(rows)) : 0;
    return `
      <section class="v16-command-row">
        <article class="v16-mission-card">
          <div class="v16-mission-icon">${C.icon("target")}</div>
          <div class="v16-mission-copy">
            <span>Today's Mission</span>
            <h2>${rows.length ? `Protect ${C.escapeHtml(dealer)} margin and push ${C.escapeHtml(model)}` : "Data not available"}</h2>
            <p>What should Sales do next from the current filter.</p>
          </div>
          <div class="v16-mission-progress">
            <span>Sales Health</span>
            <strong>${Math.round(progress)}<small>%</small></strong>
            ${C.progress(progress, "risk")}
            <p>${rows.length ? `${fmt(rows.length)} records reviewed` : "Data not available"}</p>
          </div>
        </article>
        <div class="v16-kpi-strip">${kpiData(rows).map(C.kpi).join("")}</div>
      </section>
    `;
  }

  function focusDirection(rows) {
    const kpis = kpiData(rows);
    const revenue = kpis.find(item => item.title === "Sales Value (MMK)")?.valueText || "Data not available";
    const dealers = group(rows, "dealer");
    const models = group(rows, "model");
    const items = [
      ["sales", "Protect sales value", revenue],
      ["forecast", "Recover GP pressure", kpis.find(item => item.title === "GP Margin")?.valueText || "Data not available"],
      ["market", "Dealer to inspect", dealers[0]?.label || "Data not available"],
      ["stock", "Model to push", models[0]?.label || "Data not available"],
      ["team", "Sales owner coverage", kpis.find(item => item.title === "Salespeople")?.valueText || "Data not available"]
    ];
    return C.panel("Focus Direction", `<div class="v16-priority-list">${items.map((item, index) => `
      <div class="v16-priority-row">
        <span>${C.icon(item[0])}</span><b>${index + 1}</b><p>${C.escapeHtml(item[1])}</p><strong>${C.escapeHtml(item[2])}</strong>
      </div>
    `).join("")}</div>`);
  }

  function actionRequired(rows) {
    const dealer = group(rows, "dealer")[0]?.label || "Data not available";
    const model = group(rows, "model")[0]?.label || "Data not available";
    const margin = sum(rows, "netReceived") ? Math.round((sum(rows, "gp1") / sum(rows, "netReceived")) * 1000) / 10 : null;
    return C.panel("Action Required", `
      <div class="v16-action-detail">
        <dl>
          <div><dt>Dealer</dt><dd>${C.escapeHtml(dealer)}</dd></div>
          <div><dt>Model</dt><dd>${C.escapeHtml(model)}</dd></div>
          <div><dt>Need</dt><dd>${rows.length ? "Review pricing and delivery priority" : "Data not available"}</dd></div>
          <div><dt>GP Margin</dt><dd>${margin === null ? "Data not available" : `${margin}%`}</dd></div>
          <div><dt>Owner</dt><dd>Sales Manager</dd></div>
        </dl>
        <button type="button">View Detail <span>${C.icon("chevron")}</span></button>
      </div>
    `);
  }

  function rankCard(title, rows, key) {
    const items = group(rows, key).slice(0, 5);
    const max = items[0]?.value || 1;
    if (!items.length) return C.panel(title, C.empty("Data not available"), "", `<select class="v16-mini-select"><option>This Year</option></select>`);
    return C.panel(title, `<div class="v16-rank-list">${items.map((item, index) => `
      <div class="v16-rank-row">
        <b>${index + 1}</b>
        <span>${C.escapeHtml(item.label)}</span>
        <i style="--bar:${pct(item.value, max)}%"></i>
        <strong>${fmt(item.value)}</strong>
      </div>
    `).join("")}</div>`, "", `<select class="v16-mini-select"><option>This Year</option></select>`);
  }

  function insight(rows) {
    const dealers = group(rows, "dealer");
    const models = group(rows, "model");
    const revenue = sum(rows, "netReceived");
    const margin = revenue ? pct(sum(rows, "gp1"), revenue) : 0;
    if (!rows.length) return C.panel("Executive Insight", C.empty("Data not available"));
    const cards = [
      ["good", `${dealers[0]?.label || "Data not available"} leads sales`, `${fmt(dealers[0]?.value || 0)} units`],
      [margin >= 8 ? "good" : "risk", "Margin quality", `${margin}% GP margin`],
      ["good", `${models[0]?.label || "Data not available"} is top model`, `${fmt(models[0]?.value || 0)} units`],
      ["good", "Sales value", fmtMoney(revenue)]
    ];
    return C.panel("Executive Insight", `<div class="v16-insight-strip">${cards.map(card => `
      <div class="v16-insight-mini ${card[0]}"><span></span><div><strong>${C.escapeHtml(card[1])}</strong><p>${C.escapeHtml(card[2])}</p></div></div>
    `).join("")}</div>`);
  }

  function pipelineSummary(rows) {
    const paymentGroups = group(rows, "payment");
    const total = rows.length;
    if (!paymentGroups.length) return C.panel("Pipeline Summary", C.empty("Data not available"));
    return C.panel("Pipeline Summary", `
      <div class="v16-funnel">
        ${paymentGroups.slice(0, 3).map((item, index) => `
          <div class="v16-funnel-step" style="--width:${Math.max(52, 100 - (index * 18))}%">
            ${C.escapeHtml(item.label)}: ${fmt(item.value)} (${pct(item.value, total)}%)
          </div>
        `).join("")}
      </div>
    `);
  }

  function chartCard(title, canvasId, className) {
    return C.panel(title, `<div class="v16-chart-box ${className || ""}"><canvas id="${canvasId}"></canvas></div>`, "", `<select class="v16-mini-select"><option>This Year</option></select>`);
  }

  function metricTile(label, value, meta) {
    return `<div class="v16-metric-tile"><span>${C.escapeHtml(label)}</span><strong>${C.escapeHtml(value)}</strong><p>${C.escapeHtml(meta || "")}</p></div>`;
  }

  function metricPanel(title, items) {
    return C.panel(title, `<div class="v16-metric-grid">${items.map(item => metricTile(item[0], item[1], item[2])).join("")}</div>`);
  }

  function missingPanel(title, fields) {
    return C.panel(title, `
      <ul class="v16-missing-list">
        <li><strong>Data not available</strong><span>Required field${fields.length > 1 ? "s" : ""}: ${fields.map(C.escapeHtml).join(", ")}</span></li>
      </ul>
    `);
  }

  function progressPanel(title, items) {
    if (!items.length) return C.panel(title, C.empty("Data not available"));
    return C.panel(title, `<div class="v16-progress-stack">${items.map(item => `
      <div class="v16-progress-row">
        <div><strong>${C.escapeHtml(item.label)}</strong><span>${C.escapeHtml(item.meta || "")}</span></div>
        <b>${C.escapeHtml(item.valueText)}</b>
        ${C.progress(item.value, statusFor(item.value))}
      </div>
    `).join("")}</div>`);
  }

  function tablePanel(title, columns, rows, emptyText = "Data not available") {
    if (!rows.length) return C.panel(title, C.empty(emptyText));
    return C.panel(title, `
      <div class="v16-table-wrap">
        <table class="v16-table">
          <thead><tr>${columns.map(column => `<th>${C.escapeHtml(column.label)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map(row => `<tr>${columns.map(column => `<td>${C.escapeHtml(column.format ? column.format(row[column.key], row) : row[column.key])}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
    `);
  }

  function movementPanel(title, rows, key) {
    const items = group(rows, key).slice(0, 5);
    if (!items.length) return C.panel(title, C.empty("Data not available"));
    return C.panel(title, `<ul class="v16-bullet-list">${items.map(item => `<li><strong>${C.escapeHtml(item.label)}</strong><span>${fmt(item.value)} sales records in current filter</span></li>`).join("")}</ul>`);
  }

  function salesOverview(rows) {
    const revenue = sum(rows, "netReceived");
    const gp = sum(rows, "gp1");
    const margin = revenue ? `${Math.round((gp / revenue) * 1000) / 10}%` : "Data not available";
    return metricPanel("Sales Overview", [
      ["Sales Units", rows.length ? fmt(rows.length) : "Data not available", "Count of filtered sales records"],
      ["Sales Value", rows.length ? fmtMoney(revenue) : "Data not available", "Bound to netReceived"],
      ["GP / GP%", rows.length ? `${fmtMoney(gp)} / ${margin}` : "Data not available", "Bound to gp1 and netReceived"]
    ]);
  }

  function salesMtdYtd(rows) {
    if (!rows.length) return metricPanel("Sales MTD / YTD", [["MTD", "Data not available", ""], ["YTD", "Data not available", ""], ["Forecast", "Data not available", ""]]);
    const latestYear = Math.max(...rows.map(row => num(row.year)));
    const latestMonth = Math.max(...rows.filter(row => num(row.year) === latestYear).map(row => num(row.month)));
    const mtdRows = rows.filter(row => num(row.year) === latestYear && num(row.month) === latestMonth);
    const ytdRows = rows.filter(row => num(row.year) === latestYear);
    const avg = Math.round(ytdRows.length / Math.max(1, latestMonth));
    return metricPanel("Sales MTD / YTD", [
      ["Sales MTD", fmt(mtdRows.length), `Latest month: ${MONTHS[latestMonth - 1] || latestMonth} ${latestYear}`],
      ["Sales YTD", fmt(ytdRows.length), `Filtered ${latestYear} records`],
      ["Forecast", fmt(avg * 12), "Run-rate projection from filtered YTD sales"]
    ]);
  }

  function selectedRowsFor(overrides = {}) {
    const original = Object.assign({}, state.filters);
    state.filters = Object.assign({}, state.filters, overrides);
    const rows = selectedRows();
    state.filters = original;
    return rows;
  }

  function comparisonRows() {
    if (state.filters.comparePeriod === "previousYear" && state.filters.year !== "all") {
      return selectedRowsFor({ year: String(num(state.filters.year) - 1) });
    }
    if (state.filters.comparePeriod === "previousPeriod" && state.filters.month !== "all") {
      const currentMonth = num(state.filters.month);
      const currentYear = state.filters.year === "all" ? null : num(state.filters.year);
      if (currentMonth > 1) return selectedRowsFor({ month: String(currentMonth - 1) });
      if (currentYear) return selectedRowsFor({ year: String(currentYear - 1), month: "12" });
    }
    return [];
  }

  function growthValue(rows) {
    const baseRows = comparisonRows();
    if (!rows.length || !baseRows.length) return null;
    const current = sum(rows, "netReceived");
    const base = sum(baseRows, "netReceived");
    return base ? ((current - base) / base) * 100 : null;
  }

  function salesKpiData(rows) {
    const revenue = sum(rows, "netReceived");
    const gp = sum(rows, "gp1");
    const margin = revenue ? (gp / revenue) * 100 : null;
    const asp = rows.length ? revenue / rows.length : null;
    const growth = growthValue(rows);
    const spark = monthlySeries(rows).map(item => item.sales);
    const sparkMax = Math.max(...spark, 1);
    const sparkline = spark.map(value => Math.round((value / sparkMax) * 100));
    return [
      { icon: "target", title: "Sales vs Target", valueText: rows.length ? fmtMoney(revenue) : "Data not available", targetText: "Data not available", achievementText: "Target data not available", meta: "Actual sales value", status: rows.length ? "watch" : "risk", sparkline },
      { icon: "sales", title: "Sales Growth", valueText: growth === null ? "Data not available" : `${Math.round(growth * 10) / 10}%`, targetText: "Data not available", achievementText: state.filters.comparePeriod === "none" ? "Select Compare" : "Compared to selected baseline", meta: "Responds to Compare", status: growth === null ? "risk" : growth >= 0 ? "good" : "risk", sparkline },
      { icon: "forecast", title: "Gross Profit", valueText: rows.length ? fmtMoney(gp) : "Data not available", targetText: "Data not available", achievementText: "Bound to gp1", meta: "Profit amount", status: gp > 0 ? "good" : "risk", sparkline },
      { icon: "health", title: "GP%", valueText: margin === null ? "Data not available" : `${Math.round(margin * 10) / 10}%`, targetText: "Data not available", achievementText: "GP / sales value", meta: "Profit quality", status: margin === null ? "risk" : margin >= 8 ? "good" : margin >= 4 ? "watch" : "risk", sparkline },
      { icon: "collection", title: "Average Selling Price", valueText: asp === null ? "Data not available" : fmtMoney(asp), targetText: "Data not available", achievementText: "Sales value / units", meta: "ASP", status: asp ? "good" : "risk", sparkline },
      { icon: "forecast", title: "Forecast Gap", valueText: "Data not available", targetText: "Data not available", achievementText: "Target/forecast fields missing", meta: "Requires target feed", status: "risk", sparkline }
    ];
  }

  function salesKpiRow(rows) {
    return `<section class="v16-sales-kpi-row">${salesKpiData(rows).map(C.kpi).join("")}</section>`;
  }

  function salesDrilldownFilters() {
    return `
      <section class="v16-sales-drilldowns" aria-label="Sales drill-down filters">
        <span>${C.escapeHtml(C.t("common.drilldown", "Drill-down"))}</span>
        <label><small>${C.escapeHtml(C.t("filter.salesperson", "Salesperson"))}</small><select data-filter="salesperson"></select></label>
      </section>
    `;
  }

  function teamDrilldownFilters() {
    return `
      <section class="v16-sales-drilldowns" aria-label="Team drill-down filters">
        <span>${C.escapeHtml(C.t("common.drilldown", "Drill-down"))}</span>
        <label><small>${C.escapeHtml(C.t("filter.salesperson", "Salesperson"))}</small><select data-filter="salesperson"></select></label>
      </section>
    `;
  }

  function conversionPanel() {
    return missingPanel("Booking to Delivery Conversion", ["bookingDate", "deliveryDate", "bookingStatus", "deliveryStatus"]);
  }

  function actionList(title, rows) {
    const dealer = group(rows, "dealer")[0]?.label || "Data not available";
    const model = group(rows, "model")[0]?.label || "Data not available";
    const staff = group(rows, "Sales Staff")[0]?.label || "Data not available";
    return C.panel(title, `<ul class="v16-bullet-list">
      <li><strong>Dealer focus</strong><span>${C.escapeHtml(dealer)}</span></li>
      <li><strong>Model focus</strong><span>${C.escapeHtml(model)}</span></li>
      <li><strong>Owner focus</strong><span>${C.escapeHtml(staff)}</span></li>
    </ul>`);
  }

  function salesInsight(rows) {
    const dealers = group(rows, "dealer");
    const models = group(rows, "model");
    const staff = group(rows, "Sales Staff");
    const revenue = sum(rows, "netReceived");
    const gp = sum(rows, "gp1");
    const margin = revenue ? Math.round((gp / revenue) * 1000) / 10 : null;
    if (!rows.length) return C.panel("Executive Sales Insight", C.empty("Data not available"));
    return C.panel("Executive Sales Insight", `<ul class="v16-bullet-list">
      <li><strong>${C.escapeHtml(dealers[0]?.label || "Data not available")}</strong><span>Top dealer contributing ${fmt(dealers[0]?.value || 0)} filtered sales records.</span></li>
      <li><strong>${C.escapeHtml(models[0]?.label || "Data not available")}</strong><span>Top model by unit contribution in the selected period.</span></li>
      <li><strong>${margin === null ? "Data not available" : `${margin}% GP`}</strong><span>${margin !== null && margin < 4 ? "Review discounting and cost leakage." : "Protect pricing quality while scaling volume."}</span></li>
      <li><strong>${C.escapeHtml(staff[0]?.label || "Data not available")}</strong><span>Assign owner follow-up for the largest current contribution area.</span></li>
    </ul>`);
  }

  function salesActionTable(rows) {
    const dealers = group(rows, "dealer").slice(0, 4);
    if (!dealers.length) return C.panel("Action Required", C.empty("Data not available"));
    const actions = dealers.map(item => {
      const dealerRows = rows.filter(row => row.dealer === item.label);
      const model = group(dealerRows, "model")[0]?.label || "Data not available";
      const owner = group(dealerRows, "Sales Staff")[0]?.label || "Sales Manager";
      const revenue = sum(dealerRows, "netReceived");
      const gp = sum(dealerRows, "gp1");
      const margin = revenue ? (gp / revenue) * 100 : null;
      return {
        dealer: item.label,
        model,
        gap: margin === null ? "Data not available" : margin < 4 ? "GP risk" : "Scale volume",
        owner,
        action: margin !== null && margin < 4 ? "Review pricing before next close" : "Push top model availability"
      };
    });
    return tablePanel("Action Required", [
      { key: "dealer", label: "Dealer" },
      { key: "model", label: "Model" },
      { key: "gap", label: "Gap" },
      { key: "owner", label: "Owner" },
      { key: "action", label: "Next action" }
    ], actions);
  }

  function salesChartCard(title, canvasId, note, className) {
    return C.panel(title, `<div class="v16-chart-box ${className || ""}"><canvas id="${canvasId}"></canvas></div>${note ? `<p class="v16-panel-note">${C.escapeHtml(note)}</p>` : ""}`);
  }

  function healthPanel(rows) {
    const score = healthScore(rows);
    return C.panel("Sales Health Score", `<div class="v16-gauge-card"><div class="v16-radial-gauge" style="--score:${clamp(score, 0, 100)}%"><div><strong>${score}</strong><span>/100</span></div></div><p>${rows.length ? "Computed from units, GP margin, and dealer breadth" : "Data not available"}</p></div>`);
  }

  function teamOverview(rows) {
    const staff = staffRows(rows);
    const revenue = sum(rows, "netReceived");
    const gp = sum(rows, "gp1");
    return metricPanel("Team Overview", [
      ["Salespeople", staff.length ? fmt(staff.length) : "Data not available", "Active sales owners in current filter"],
      ["Team Sales", rows.length ? fmt(rows.length) : "Data not available", "Delivered sales records"],
      ["Sales Value", rows.length ? fmtMoney(revenue) : "Data not available", "Bound to netReceived"],
      ["Gross Profit", rows.length ? fmtMoney(gp) : "Data not available", "Bound to gp1"],
      ["Dealer Coverage", group(rows, "dealer").length ? fmt(group(rows, "dealer").length) : "Data not available", "Distinct dealers served"],
      ["Team Health", rows.length ? `${healthScore(rows)}/100` : "Data not available", "Sales, margin, and breadth"]
    ]);
  }

  function organizationStructure(rows) {
    const regions = topGroups(rows, "region", 6);
    if (!regions.length) return C.panel("Organization Structure", C.empty("Data not available"));
    return C.panel("Organization Structure", `<ul class="v16-org-list">${regions.map(region => {
      const regionRows = rows.filter(row => row.region === region.label);
      const people = group(regionRows, "Sales Staff").length;
      const dealers = group(regionRows, "dealer").length;
      return `<li><strong>${C.escapeHtml(region.label)}</strong><span>${fmt(people)} salespeople / ${fmt(dealers)} dealers / ${fmt(region.value)} records</span></li>`;
    }).join("")}</ul>`);
  }

  function targetAchievementByPerson(rows) {
    return missingPanel("Target Achievement by Person", ["salesTarget", "targetPeriod", "targetOwner"]);
  }

  function teamActivityMissing() {
    return [
      missingPanel("Visit Activity", ["visitDate", "customerName", "visitOutcome", "Sales Staff"]),
      missingPanel("Call / Follow-up Activity", ["callDate", "followUpDate", "followUpStatus", "Sales Staff"])
    ].join("");
  }

  function closingRate(rows) {
    const people = staffRows(rows).slice(0, 5);
    return progressPanel("Closing Rate", people.map(person => ({
      label: person.label,
      value: person.margin === null ? 0 : clamp(person.margin * 6, 0, 100),
      valueText: person.margin === null ? "Data not available" : `${Math.round(person.margin * 10) / 10}% GP`,
      meta: "Profit-quality proxy because lead/close fields are missing"
    })));
  }

  function dealerAssignment(rows) {
    const people = staffRows(rows).slice(0, 8).map(person => ({
      name: person.label,
      dealers: person.dealers,
      units: person.value,
      value: person.revenue
    }));
    return tablePanel("Dealer Assignment", [
      { key: "name", label: "Salesperson" },
      { key: "dealers", label: "Dealers", format: fmt },
      { key: "units", label: "Sales", format: fmt },
      { key: "value", label: "Value", format: fmtMoney }
    ], people);
  }

  function trainingStatus() {
    return missingPanel("Training / Skill Status", ["trainingProgram", "trainingStatus", "skillScore", "certificationDate"]);
  }

  function topPerformer(rows) {
    const top = staffRows(rows)[0];
    if (!top) return C.panel("Top Performer", C.empty("Data not available"));
    return C.panel("Top Performer", `<div class="v16-spotlight">
      <span>${C.icon("team")}</span>
      <strong>${C.escapeHtml(top.label)}</strong>
      <p>${fmt(top.value)} sales records / ${fmtMoney(top.revenue)} sales value / ${fmt(top.dealers)} dealers</p>
    </div>`);
  }

  function atRiskSalesperson(rows) {
    const risk = staffRows(rows).slice().sort((a, b) => a.health - b.health)[0];
    if (!risk) return C.panel("At-risk Salesperson", C.empty("Data not available"));
    return C.panel("At-risk Salesperson", `<div class="v16-spotlight risk">
      <span>${C.icon("health")}</span>
      <strong>${C.escapeHtml(risk.label)}</strong>
      <p>${fmt(risk.value)} sales records / ${risk.margin === null ? "Data not available" : `${Math.round(risk.margin * 10) / 10}% GP margin`} / ${fmt(risk.dealers)} dealers</p>
    </div>`);
  }

  function coachingRequired(rows) {
    const people = staffRows(rows).slice().sort((a, b) => a.health - b.health).slice(0, 4);
    if (!people.length) return C.panel("Coaching Required", C.empty("Data not available"));
    return C.panel("Coaching Required", `<ul class="v16-bullet-list">${people.map(person => `
      <li><strong>${C.escapeHtml(person.label)}</strong><span>${person.margin !== null && person.margin < 4 ? "Review pricing discipline and GP quality" : "Review dealer coverage and activity cadence"}</span></li>
    `).join("")}</ul>`);
  }

  function teamInsight(rows) {
    const top = staffRows(rows)[0];
    const dealer = group(rows, "dealer")[0];
    return C.panel("Team Insight", `<div class="v16-insight-strip">
      <div class="v16-insight-mini good"><span></span><div><strong>${C.escapeHtml(top?.label || "Data not available")}</strong><p>Top salesperson by filtered sales records</p></div></div>
      <div class="v16-insight-mini good"><span></span><div><strong>${C.escapeHtml(dealer?.label || "Data not available")}</strong><p>Highest dealer workload</p></div></div>
      <div class="v16-insight-mini ${healthScore(rows) >= 70 ? "good" : "risk"}"><span></span><div><strong>${healthScore(rows)}/100</strong><p>Team performance health</p></div></div>
      <div class="v16-insight-mini risk"><span></span><div><strong>Activity fields missing</strong><p>Visits, calls, and training need source columns</p></div></div>
    </div>`);
  }

  function renderTeam(rows) {
    return [
      teamDrilldownFilters(),
      `<section class="v16-page-band two">${teamOverview(rows)}${healthPanel(rows)}</section>`,
      `<section class="v16-page-band wide">${chartCard("Salesperson Ranking", "teamRankingChart")}${organizationStructure(rows)}</section>`,
      `<section class="v16-page-band">${targetAchievementByPerson(rows)}${teamActivityMissing()}</section>`,
      `<section class="v16-page-band">${chartCard("Call / Follow-up Trend", "teamFollowupChart", "short")}${closingRate(rows)}${trainingStatus()}</section>`,
      `<section class="v16-page-band two">${dealerAssignment(rows)}${progressPanel("Team Performance Health", staffRows(rows).slice(0, 6).map(person => ({ label: person.label, value: person.health, valueText: `${person.health}/100`, meta: `${fmt(person.value)} sales records` })))}</section>`,
      `<section class="v16-page-band">${topPerformer(rows)}${atRiskSalesperson(rows)}${coachingRequired(rows)}</section>`,
      `<section class="v16-page-band two">${teamInsight(rows)}${actionList("Action Required", rows)}</section>`
    ].join("");
  }

  function reportCard(title, meta, icon, action) {
    return `<article class="v16-report-card">
      <span>${C.icon(icon || "reports")}</span>
      <div><strong>${C.escapeHtml(title)}</strong><p>${C.escapeHtml(meta)}</p></div>
      <button type="button" data-action="${C.escapeHtml(action || "export")}">${C.icon("export")}</button>
    </article>`;
  }

  function reportsCenter(rows) {
    const reports = [
      ["Daily Report", "Daily sales movements and dealer activity"],
      ["Weekly Report", "Weekly sales, salesperson, and model review"],
      ["Monthly Report", "Month-end sales, GP, and dealer summary"],
      ["Quarterly Report", "Quarter performance pack"],
      ["Yearly Report", "Annual sales intelligence archive"],
      ["Sales Report", "Filtered delivered sales records"],
      ["Booking Report", "Data not available: booking fields required"],
      ["Stock Report", "Data not available: stock fields required"],
      ["Team Report", "Salesperson ranking and coverage"],
      ["Executive Summary", "Leadership-ready sales health brief"]
    ];
    return C.panel("Report Center", `<div class="v16-report-grid">${reports.map(report => reportCard(report[0], report[1], "reports")).join("")}</div>`);
  }

  function exportStatus() {
    return metricPanel("Export Status", [
      ["Export PDF", "Ready", "Layout export action is configured in Reports"],
      ["Export Excel", "Ready", "Exports filtered CSV from existing data"],
      ["Export PowerPoint", "Data not available", "Requires presentation export service"]
    ]);
  }

  function reportArchive(rows) {
    return tablePanel("Report Archive", [
      { key: "period", label: "Period" },
      { key: "records", label: "Records", format: fmt },
      { key: "value", label: "Sales Value", format: fmtMoney }
    ], monthlySeries(rows).filter(item => item.sales).slice(-6).reverse().map(item => ({
      period: item.label,
      records: item.sales,
      value: sum(rows.filter(row => MONTHS[num(row.month) - 1] === item.label), "netReceived")
    })));
  }

  function savedViewsSchedule() {
    return [
      missingPanel("Saved Views", ["savedViewId", "savedViewName", "owner", "filterState"]),
      missingPanel("Schedule Report", ["scheduleId", "reportType", "recipient", "frequency", "nextRunAt"])
    ].join("");
  }

  function renderReports(rows) {
    return [
      reportsCenter(rows),
      `<section class="v16-page-band two">${exportStatus()}${chartCard("Report Category", "reportCategoryChart", "short")}</section>`,
      `<section class="v16-page-band">${reportArchive(rows)}${savedViewsSchedule()}</section>`,
      `<section class="v16-page-band two">${missingPanel("Report Usage Trend", ["reportUsageDate", "reportType", "usageCount"])}${C.panel("Export Actions", `<div class="v16-export-stack">
        <button type="button" data-action="export">${C.icon("export")} Export Excel</button>
        <button type="button">${C.icon("reports")} Export PDF</button>
        <button type="button">${C.icon("reports")} Export PowerPoint</button>
      </div>`)}</section>`
    ].join("");
  }

  function settingInput(label, value, type = "text", id = "") {
    return `<label class="v16-setting-field">
      <span>${C.escapeHtml(label)}</span>
      <input ${id ? `id="${C.escapeHtml(id)}"` : ""} type="${C.escapeHtml(type)}" value="${C.escapeHtml(value)}">
    </label>`;
  }

  function settingSelect(label, options, selected, id = "") {
    return `<label class="v16-setting-field">
      <span>${C.escapeHtml(label)}</span>
      <select ${id ? `id="${C.escapeHtml(id)}"` : ""}>
        ${options.map(option => `<option value="${C.escapeHtml(option)}" ${option === selected ? "selected" : ""}>${C.escapeHtml(option)}</option>`).join("")}
      </select>
    </label>`;
  }

  function settingToggle(label, checked = true) {
    return `<label class="v16-switch-row">
      <span>${C.escapeHtml(label)}</span>
      <input type="checkbox" ${checked ? "checked" : ""}>
      <i aria-hidden="true"></i>
    </label>`;
  }

  function settingAction(label, icon = "settings", tone = "") {
    return `<button type="button" class="v16-setting-action ${C.escapeHtml(tone)}">${C.icon(icon)} ${C.escapeHtml(label)}</button>`;
  }

  function settingSection(id, icon, title, purpose, body, extraClass = "") {
    return `<section class="v16-settings-section ${C.escapeHtml(extraClass)}" id="${C.escapeHtml(id)}">
      <div class="v16-settings-section-head">
        <span>${C.icon(icon)}</span>
        <div>
          <h2>${C.escapeHtml(title)}</h2>
          <p>${C.escapeHtml(purpose)}</p>
        </div>
      </div>
      ${body}
    </section>`;
  }

  function statusPill(label, status = "good") {
    return `<span class="v16-status-pill ${C.escapeHtml(status)}">${C.escapeHtml(label)}</span>`;
  }

  const KPI_DICTIONARY = [
    { name: "Sales Units", category: "Sales", definition: "Delivered unit count in the selected period.", formula: "COUNT(delivered sales records)", unit: "Units", target: "400", warning: "< 85%", critical: "< 70%", source: "Sales dataset", mapping: "ref, dealer, model", frequency: "Daily", owner: "Sales Operations", description: "Primary volume KPI used across executive, sales, team, and dealer views.", updated: "2026-06-17" },
    { name: "Sales Value", category: "Sales", definition: "Net received sales value for delivered records.", formula: "SUM(netReceived)", unit: "MMK", target: "Data governed by target file", warning: "< 90%", critical: "< 75%", source: "Sales dataset", mapping: "netReceived", frequency: "Daily", owner: "Finance Control", description: "Measures realized revenue after applied commercial adjustments.", updated: "2026-06-17" },
    { name: "Gross Profit", category: "Financial", definition: "Gross profit amount from delivered sales records.", formula: "SUM(gp1)", unit: "MMK", target: "Positive GP by dealer", warning: "< 8% margin", critical: "< 4% margin", source: "Sales dataset", mapping: "gp1", frequency: "Daily", owner: "Finance Control", description: "Profit amount used for margin quality and risk review.", updated: "2026-06-17" },
    { name: "GP Margin", category: "Financial", definition: "Gross profit divided by sales value.", formula: "SUM(gp1) / SUM(netReceived) x 100", unit: "%", target: ">= 10%", warning: "4% - 7.9%", critical: "< 4%", source: "Sales dataset", mapping: "gp1, netReceived", frequency: "Daily", owner: "Sales Finance", description: "Indicates pricing discipline and profit quality.", updated: "2026-06-17" },
    { name: "Booking Conversion", category: "Booking", definition: "Bookings converted into delivered sales.", formula: "Delivered bookings / Total bookings x 100", unit: "%", target: ">= 82%", warning: "< 75%", critical: "< 60%", source: "Future booking feed", mapping: "bookingStatus, deliveryStatus", frequency: "Daily", owner: "Sales Operations", description: "Prepared for booking-to-delivery source fields.", updated: "2026-06-17" },
    { name: "Delivery Readiness", category: "Delivery", definition: "Ready deliveries compared with planned deliveries.", formula: "Ready delivery units / Planned delivery units x 100", unit: "%", target: ">= 90%", warning: "< 80%", critical: "< 65%", source: "Future delivery feed", mapping: "deliveryDate, deliveryStatus", frequency: "Daily", owner: "Logistics", description: "Monitors fulfillment readiness and delivery execution.", updated: "2026-06-17" },
    { name: "Landing ETA Risk", category: "Landing", definition: "Landing records at risk of missing expected arrival.", formula: "COUNT(delayed landing records)", unit: "Records", target: "0", warning: "> 3", critical: "> 8", source: "Future landing feed", mapping: "landingDate, etaDate, shipmentStatus", frequency: "Daily", owner: "Supply Chain", description: "Tracks shipment and landing delay exposure.", updated: "2026-06-17" },
    { name: "Collection Rate", category: "Collection", definition: "Collected value compared with collectible value.", formula: "Collected amount / Collectible amount x 100", unit: "%", target: ">= 92%", warning: "< 85%", critical: "< 75%", source: "Future collection feed", mapping: "collectionAmount, receivableAmount", frequency: "Daily", owner: "Credit Control", description: "Controls cash collection performance.", updated: "2026-06-17" },
    { name: "Forecast Accuracy", category: "Forecast", definition: "Accuracy between forecast and actual sales.", formula: "100 - ABS(Forecast - Actual) / Actual x 100", unit: "%", target: ">= 88%", warning: "< 78%", critical: "< 65%", source: "Forecast engine", mapping: "forecastUnits, actualUnits", frequency: "Weekly", owner: "Planning", description: "Measures forecast model quality over time.", updated: "2026-06-17" },
    { name: "Stock Health", category: "Stock", definition: "Composite score for ready stock, aging, and demand fit.", formula: "Ready stock 45% + Aging 30% + Demand fit 25%", unit: "Score", target: ">= 85", warning: "< 70", critical: "< 55", source: "Future stock feed", mapping: "stockOnHand, stockAgeDays, readyToSellQty", frequency: "Daily", owner: "Inventory Control", description: "Prepared for stock optimization and aging review.", updated: "2026-06-17" },
    { name: "Pipeline Value", category: "Pipeline", definition: "Weighted value of open sales opportunities.", formula: "SUM(opportunityValue x stageProbability)", unit: "MMK", target: "3x monthly target", warning: "< 2x", critical: "< 1.5x", source: "Future CRM feed", mapping: "opportunityValue, opportunityStage", frequency: "Daily", owner: "Sales Management", description: "Forward-looking demand and coverage indicator.", updated: "2026-06-17" },
    { name: "Market Opportunity", category: "Market", definition: "Qualified market opportunities by area and dealer.", formula: "COUNT(qualified leads) + weighted opportunity value", unit: "Index", target: ">= 80", warning: "< 65", critical: "< 50", source: "Future market feed", mapping: "leadStatus, area, opportunityValue", frequency: "Weekly", owner: "Market Development", description: "Prepared for dealer opportunity and campaign analysis.", updated: "2026-06-17" },
    { name: "Team Coverage", category: "Team", definition: "Active salesperson and dealer coverage in the selected period.", formula: "DISTINCT(Sales Staff) + DISTINCT(dealer)", unit: "Count", target: "Full assigned coverage", warning: "Coverage gap detected", critical: "No owner assigned", source: "Sales dataset", mapping: "Sales Staff, dealer", frequency: "Daily", owner: "Sales Management", description: "Highlights sales owner coverage and workload breadth.", updated: "2026-06-17" },
    { name: "Sales Health Score", category: "Health Score", definition: "Composite score for sales volume, margin, and dealer breadth.", formula: "Units 45% + GP margin 35% + Dealer breadth 20%", unit: "Score", target: ">= 88", warning: "70 - 87", critical: "< 70", source: "Calculated", mapping: "netReceived, gp1, dealer", frequency: "Live", owner: "Executive Office", description: "Executive health indicator shown across the V16 shell.", updated: "2026-06-17" }
  ];

  const AUDIT_LOGS = [
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "Login", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." },
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "Logout", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." },
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "Excel Import", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." },
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "Dataset Refresh", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." },
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "Settings Changed", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." },
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "KPI Changed", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." },
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "Permission Changed", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." },
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "Export", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." },
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "Failed Login", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." },
    { date: "Data not available", time: "Data not available", user: "Data not available", company: "KMM", dealer: "All", action: "System Error", module: "Audit Source", result: "Data not available", ip: "Data not available", details: "Audit source fields are not available in the current local dataset." }
  ];

  const AI_MODULES = [
    { name: "Executive Insight", provider: "OpenAI", enabled: true, confidence: 92, status: "Ready", prompt: "Executive daily insight", version: "v3.2", history: "18 insights", recommendation: "Margin protection", accuracy: "91%", training: "Complete", lastRun: "2026-06-17 17:45" },
    { name: "Sales Recommendation", provider: "Azure OpenAI", enabled: true, confidence: 88, status: "Ready", prompt: "Sales next best action", version: "v2.8", history: "42 recommendations", recommendation: "Dealer focus list", accuracy: "86%", training: "Complete", lastRun: "2026-06-17 17:20" },
    { name: "Forecast AI", provider: "Local LLM", enabled: false, confidence: 73, status: "Standby", prompt: "Forecast gap analysis", version: "v1.9", history: "8 forecasts", recommendation: "Run after target feed", accuracy: "78%", training: "Queued", lastRun: "2026-06-17 14:48" },
    { name: "Market Analysis", provider: "OpenAI", enabled: true, confidence: 84, status: "Ready", prompt: "Market opportunity scan", version: "v2.1", history: "14 analyses", recommendation: "Area opportunity", accuracy: "82%", training: "Complete", lastRun: "2026-06-17 16:05" },
    { name: "Stock Optimization", provider: "Other Provider", enabled: false, confidence: 69, status: "Waiting for stock feed", prompt: "Stock aging optimizer", version: "v1.4", history: "3 simulations", recommendation: "Fast moving allocation", accuracy: "Data pending", training: "Pending", lastRun: "Not run" },
    { name: "Dealer Recommendation", provider: "Azure OpenAI", enabled: true, confidence: 87, status: "Ready", prompt: "Dealer prioritization", version: "v2.5", history: "27 recommendations", recommendation: "Coverage expansion", accuracy: "85%", training: "Complete", lastRun: "2026-06-17 17:10" },
    { name: "Prompt Library", provider: "Local LLM", enabled: true, confidence: 100, status: "Configured", prompt: "Reusable business prompt catalog", version: "v1.0", history: "12 templates", recommendation: "Governed prompt reuse", accuracy: "N/A", training: "N/A", lastRun: "Configuration only" },
    { name: "AI Model Settings", provider: "OpenAI", enabled: true, confidence: 100, status: "Configured", prompt: "Provider, confidence, and guardrail settings", version: "v1.0", history: "Configuration", recommendation: "Use approved providers only", accuracy: "N/A", training: "N/A", lastRun: "Configuration only" },
    { name: "Sales Health AI", provider: "Local LLM", enabled: true, confidence: 90, status: "Ready", prompt: "Health score narrative", version: "v3.0", history: "31 summaries", recommendation: "Risk narrative", accuracy: "89%", training: "Complete", lastRun: "2026-06-17 17:45" }
  ];

  function settingsToolbar(searchId, filterId, filterLabel, options, exportAction) {
    return `<div class="v16-settings-toolbar">
      <label class="v16-settings-search">${C.icon("search")}<input id="${C.escapeHtml(searchId)}" type="search" placeholder="Search"></label>
      <label class="v16-setting-field compact"><span>${C.escapeHtml(filterLabel)}</span><select id="${C.escapeHtml(filterId)}">
        <option value="all">All</option>
        ${options.map(option => `<option value="${C.escapeHtml(option)}">${C.escapeHtml(option)}</option>`).join("")}
      </select></label>
      <button type="button" class="v16-setting-action primary" data-action="${C.escapeHtml(exportAction)}">${C.icon("export")} Export</button>
    </div>`;
  }

  function detailButton(type, id, label = "View") {
    return `<button type="button" class="v16-row-action" data-detail-type="${C.escapeHtml(type)}" data-detail-id="${C.escapeHtml(id)}">${C.icon("chevron")} ${C.escapeHtml(label)}</button>`;
  }

  function settingsKpiDictionary() {
    const categories = ["Sales", "Booking", "Delivery", "Landing", "Collection", "Forecast", "Stock", "Pipeline", "Market", "Team", "Financial", "Health Score"];
    const isAdmin = /admin/i.test(window.KMMSecurity?.settings?.readSettings?.()?.role || "");
    const featured = KPI_DICTIONARY[0];
    return settingSection("settings-kpi-dictionary", "target", "KPI Dictionary", "Centralized KPI Management Center.", `
      <div class="v16-settings-card-grid">
        <div class="v16-settings-card span-2">
          ${settingsToolbar("kpiDictionarySearch", "kpiDictionaryCategory", "Category", categories, "exportKpiDictionary")}
          <div class="v16-enterprise-table-wrap">
            <table class="v16-enterprise-table" data-settings-table="kpi">
              <thead><tr><th>KPI Name</th><th>Definition</th><th>Formula</th><th>Unit</th><th>Target</th><th>Threshold</th><th>Data Source</th><th>Field Mapping</th><th>Owner</th><th>Update Frequency</th></tr></thead>
              <tbody>
                ${KPI_DICTIONARY.map((item, index) => `<tr data-kpi-row data-category="${C.escapeHtml(item.category)}" data-search="${C.escapeHtml(Object.values(item).join(" ").toLowerCase())}">
                  <td><button type="button" class="v16-table-link" data-detail-type="kpi" data-detail-id="${index}">${C.escapeHtml(item.name)}</button><small>${C.escapeHtml(item.definition)}</small></td>
                  <td>${C.escapeHtml(item.definition)}</td>
                  <td>${detailButton("kpi", index, "Formula")}</td>
                  <td>${C.escapeHtml(item.unit)}</td>
                  <td>${C.escapeHtml(item.target)}</td>
                  <td>${C.escapeHtml(`Warning ${item.warning} / Critical ${item.critical}`)}</td>
                  <td>${C.escapeHtml(item.source)}</td>
                  <td>${C.escapeHtml(item.mapping)}</td>
                  <td>${C.escapeHtml(item.owner)}</td>
                  <td>${C.escapeHtml(item.frequency)}</td>
                </tr>
                <tr class="v16-expand-row" data-kpi-row data-category="${C.escapeHtml(item.category)}" data-search="${C.escapeHtml(Object.values(item).join(" ").toLowerCase())}">
                  <td colspan="10"><strong>${C.escapeHtml(item.formula)}</strong><span>${C.escapeHtml(item.description)} Category: ${C.escapeHtml(item.category)}. Last updated: ${C.escapeHtml(item.updated)}.</span></td>
                </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <aside class="v16-settings-card v16-preview-panel">
          <span>KPI Preview</span>
          <strong>${C.escapeHtml(featured.name)}</strong>
          <p>${C.escapeHtml(featured.description)}</p>
          <dl>
            <div><dt>Warning</dt><dd>${C.escapeHtml(featured.warning)}</dd></div>
            <div><dt>Critical</dt><dd>${C.escapeHtml(featured.critical)}</dd></div>
            <div><dt>Frequency</dt><dd>${C.escapeHtml(featured.frequency)}</dd></div>
            <div><dt>Admin Edit</dt><dd>${isAdmin ? "Available" : "Admin only"}</dd></div>
          </dl>
          <button type="button" class="v16-setting-action ${isAdmin ? "primary" : ""}" ${isAdmin ? "" : "disabled"}>${C.icon("settings")} Edit KPI</button>
        </aside>
      </div>
    `);
  }

  function settingsAuditLog() {
    const actions = ["Login", "Logout", "Excel Import", "Dataset Refresh", "Settings Changed", "KPI Changed", "User Created", "Permission Changed", "Export PDF", "Export Excel", "Export PowerPoint", "Delete Data", "System Error", "Failed Login"];
    return settingSection("settings-audit-log", "reports", "Audit Log", "Track important activity inside the system.", `
      <div class="v16-settings-card-grid">
        <div class="v16-settings-card span-2">
          ${settingsToolbar("auditLogSearch", "auditLogAction", "Action", actions, "exportAuditLog")}
          <div class="v16-enterprise-table-wrap">
            <table class="v16-enterprise-table" data-settings-table="audit">
              <thead><tr><th>Date</th><th>Time</th><th>User</th><th>Company</th><th>Dealer</th><th>Action</th><th>Module</th><th>Result</th><th>Detail</th></tr></thead>
              <tbody>
                ${AUDIT_LOGS.map((item, index) => `<tr data-audit-row data-action-name="${C.escapeHtml(item.action)}" data-search="${C.escapeHtml(Object.values(item).join(" ").toLowerCase())}">
                  <td>${C.escapeHtml(item.date)}</td><td>${C.escapeHtml(item.time)}</td><td>${C.escapeHtml(item.user)}</td><td>${C.escapeHtml(item.company)}</td><td>${C.escapeHtml(item.dealer)}</td><td>${C.escapeHtml(item.action)}</td><td>${C.escapeHtml(item.module)}</td><td>${statusPill(item.result, item.result === "Success" ? "good" : item.result === "Warning" ? "watch" : "risk")}</td><td>${detailButton("audit", index, "Open")}</td>
                </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <aside class="v16-settings-card">
          <div class="v16-settings-metrics single">
            <div><span>Success</span><strong>${AUDIT_LOGS.filter(item => item.result === "Success").length}</strong><small>green status</small></div>
            <div><span>Warning</span><strong>${AUDIT_LOGS.filter(item => item.result === "Warning").length}</strong><small>orange status</small></div>
            <div><span>Failed</span><strong>${AUDIT_LOGS.filter(item => item.result === "Failed").length}</strong><small>red status</small></div>
          </div>
          <ol class="v16-audit-timeline">
            ${AUDIT_LOGS.slice(0, 6).map(item => `<li class="${C.escapeHtml(item.result.toLowerCase())}"><strong>${C.escapeHtml(item.action)}</strong><span>${C.escapeHtml(item.time)} / ${C.escapeHtml(item.user)} / ${C.escapeHtml(item.module)}</span></li>`).join("")}
          </ol>
        </aside>
      </div>
    `);
  }

  function settingsAiIntelligence() {
    const providers = ["OpenAI", "Azure OpenAI", "Local LLM", "Other Provider"];
    return settingSection("settings-ai", "health", "AI Intelligence Center", "Manage AI capability configuration.", `
      <div class="v16-settings-card-grid">
        <div class="v16-settings-card span-2">
          <div class="v16-ai-provider-row">
            ${providers.map(provider => `<div><span>${C.escapeHtml(provider)}</span><strong>Supported</strong><small>Provider adapter</small></div>`).join("")}
          </div>
          <div class="v16-ai-module-grid">
            ${AI_MODULES.map((item, index) => `<article class="v16-ai-card" data-ai-row data-provider="${C.escapeHtml(item.provider)}" data-search="${C.escapeHtml(Object.values(item).join(" ").toLowerCase())}">
              <header><span>${C.icon(item.enabled ? "health" : "settings")}</span><div><strong>${C.escapeHtml(item.name)}</strong><small>${C.escapeHtml(item.provider)} / ${C.escapeHtml(item.status)}</small></div>${settingToggle(item.enabled ? "Enabled" : "Disabled", item.enabled)}</header>
              <div class="v16-ai-score"><b>${C.escapeHtml(item.confidence)}%</b>${C.progress(item.confidence, item.confidence >= 85 ? "good" : "watch")}</div>
              <dl>
                <div><dt>Prompt</dt><dd>${C.escapeHtml(item.prompt)}</dd></div>
                <div><dt>Version</dt><dd>${C.escapeHtml(item.version)}</dd></div>
                <div><dt>History</dt><dd>${C.escapeHtml(item.history)}</dd></div>
                <div><dt>Forecast Accuracy</dt><dd>${C.escapeHtml(item.accuracy)}</dd></div>
                <div><dt>Training</dt><dd>${C.escapeHtml(item.training)}</dd></div>
                <div><dt>Last AI Run</dt><dd>${C.escapeHtml(item.lastRun)}</dd></div>
              </dl>
              <footer><button type="button" class="v16-setting-action" data-detail-type="ai" data-detail-id="${index}">${C.icon("reports")} Prompt</button><button type="button" class="v16-setting-action primary">${C.icon("refresh")} Refresh AI</button></footer>
            </article>`).join("")}
          </div>
        </div>
        <aside class="v16-settings-card">
          <div class="v16-settings-tabs" role="tablist">
            <button type="button" class="is-active" data-settings-tab="promptLibrary">Prompt Library</button>
            <button type="button" data-settings-tab="aiConfig">AI Configuration</button>
          </div>
          <div class="v16-settings-tab-panel is-active" data-settings-panel="promptLibrary">
            <div class="v16-formula-box">Executive Insight / v3.2 / Confidence guardrail 85%</div>
            <div class="v16-formula-box">Dealer Recommendation / v2.5 / Ranked action template</div>
            <div class="v16-formula-box">Forecast AI / v1.9 / Accuracy review template</div>
          </div>
          <div class="v16-settings-tab-panel" data-settings-panel="aiConfig">
            ${settingSelect("Default Provider", providers, "OpenAI")}
            ${settingSelect("Fallback Provider", providers, "Local LLM")}
            ${settingInput("Minimum Confidence Score", "80", "number")}
          </div>
          <div class="v16-settings-actions">
            ${settingAction("Manual Generate Insight", "target", "primary")}
            ${settingAction("Insight History", "reports")}
            ${settingAction("Recommendation History", "reports")}
          </div>
        </aside>
      </div>
      <div class="v16-detail-drawer" id="settingsDetailDrawer" aria-live="polite"></div>
    `);
  }

  function settingsProfile() {
    return settingSection("settings-profile", "team", "User Profile", "Personal preferences.", `
      <form id="settingsForm" class="v16-settings-card-grid">
        <div class="v16-profile-photo-card">
          <div class="v16-settings-avatar" id="settingsProfileAvatar">M</div>
          <strong>Profile Photo</strong>
          <button type="button" class="v16-setting-action">${C.icon("export")} Upload Photo</button>
        </div>
        <div class="v16-settings-card span-2">
          <div class="v16-settings-form-grid">
            ${settingInput("Name", "Montree C.", "text", "settingsUsername")}
            ${settingInput("Position", "Sales Division Manager")}
            ${settingInput("Company", "KUBOTA MAESOD MYANMAR")}
            ${settingInput("Email", "montree@kmm.example", "email")}
            ${settingInput("Phone", "+95 9 000 000 000", "tel")}
            ${settingSelect("Language", ["th", "en"], "th", "settingsLanguage")}
            ${settingSelect("Time Zone", ["Asia/Yangon", "Asia/Bangkok", "UTC"], "Asia/Yangon")}
            ${settingSelect("Theme", ["Light", "Dark"], "Light", "settingsTheme")}
            ${settingSelect("Dashboard Landing Page", ["Focus", "Sales", "Market", "Stock", "Team", "Reports"], "Focus")}
            <select id="settingsCompany" hidden><option value="KMM">KMM</option><option value="KM">KM</option></select>
            <input id="settingsTimeout" type="hidden" value="15">
            <input id="settingsRole" type="hidden" value="">
            <input id="settingsVersion" type="hidden" value="">
          </div>
          <div class="v16-settings-actions">
            ${settingAction("Change Password", "settings")}
            <button type="submit" class="v16-setting-action primary">${C.icon("target")} Save Profile</button>
            <span id="settingsStatus" class="v16-settings-status">Ready</span>
          </div>
        </div>
      </form>
    `);
  }

  function settingsDashboard(rows) {
    const dealers = unique(rows, "dealer").slice(0, 6);
    const years = unique(rows, "year").map(String);
    const months = unique(rows, "month").map(String);
    const weeks = unique(rows, "week").map(String);
    return settingSection("settings-dashboard", "focus", "Dashboard Preferences", "Personal dashboard settings.", `
      <div class="v16-settings-card">
        <div class="v16-settings-form-grid">
          ${settingSelect("Default Dealer", ["All"].concat(dealers), "All")}
          ${settingSelect("Default Year", ["All"].concat(years), years[years.length - 1] || "All")}
          ${settingSelect("Default Month", ["All"].concat(months), "All")}
          ${settingSelect("Default Week", ["All"].concat(weeks), "All")}
          ${settingSelect("Default Compare Period", ["No Compare", "Previous Period", "Previous Year"], "No Compare")}
          ${settingSelect("Default Home Page", ["Focus", "Sales", "Reports"], "Focus")}
          ${settingSelect("Card Density", ["Comfortable", "Compact", "Dense"], "Comfortable")}
          ${settingToggle("Remember Last Filters", true)}
          ${settingToggle("Compact Mode", false)}
          ${settingToggle("Animation On / Off", true)}
        </div>
      </div>
    `);
  }

  function settingsDataManagement(rows) {
    const latestYear = rows.length ? Math.max(...rows.map(row => num(row.year))) : 2026;
    const latestMonth = rows.length ? Math.max(...rows.filter(row => num(row.year) === latestYear).map(row => num(row.month))) : 6;
    return settingSection("settings-data", "stock", "Data Management", "Manage business data.", `
      <div class="v16-settings-card-grid">
        <div class="v16-settings-card">
          <div class="v16-upload-drop">
            ${C.icon("export")}
            <strong>Upload Excel</strong>
            <span>Ready for .xlsx import</span>
            ${settingAction("Choose File", "export", "primary")}
          </div>
          <div class="v16-upload-status">
            <div><span>Upload Status</span>${statusPill("Ready", "good")}</div>
            <div><span>Import Errors</span><strong>0 blocking issues</strong></div>
            <div><span>Latest Update</span><strong>${C.escapeHtml(MONTHS[latestMonth - 1] || "Jun")} ${latestYear}</strong></div>
          </div>
        </div>
        <div class="v16-settings-card span-2">
          <div class="v16-settings-metrics">
            <div><span>Import History</span><strong>${fmt(rows.length)}</strong><small>records loaded</small></div>
            <div><span>Last Refresh Time</span><strong id="settingsLatestRefresh">--:--</strong><small>browser session</small></div>
            <div><span>Data Quality Score</span><strong>96%</strong><small>validated fields</small></div>
          </div>
          <div class="v16-settings-actions">
            ${settingAction("Replace Dataset", "refresh")}
            ${settingAction("Data Validation", "health")}
            ${settingAction("Missing Data Report", "reports")}
            ${settingAction("Refresh Dataset", "refresh", "primary")}
          </div>
        </div>
      </div>
    `);
  }

  function settingsKpi() {
    return settingSection("settings-kpi", "target", "KPI Configuration", "Business KPI settings.", `
      <div class="v16-settings-card-grid">
        <div class="v16-settings-card span-2">
          <div class="v16-settings-tabs" role="tablist">
            <button type="button" class="is-active" data-settings-tab="targets">Targets</button>
            <button type="button" data-settings-tab="formulas">Formulas</button>
            <button type="button" data-settings-tab="rules">Color Rules</button>
          </div>
          <div class="v16-settings-tab-panel is-active" data-settings-panel="targets">
            <div class="v16-settings-form-grid">
              ${settingInput("Sales Target", "400", "number", "kpiSalesTarget")}
              ${settingInput("Booking Target", "520", "number", "kpiBookingTarget")}
              ${settingInput("Delivery Target", "360", "number")}
              ${settingInput("Collection Target", "92", "number")}
            </div>
          </div>
          <div class="v16-settings-tab-panel" data-settings-panel="formulas">
            <div class="v16-formula-box">Forecast Formula = Actual Sales + Weighted Booking Pipeline</div>
            <div class="v16-formula-box">Sales Health Score = Achievement x 45% + Margin x 35% + Dealer Breadth x 20%</div>
          </div>
          <div class="v16-settings-tab-panel" data-settings-panel="rules">
            <div class="v16-rule-grid">
              <span>Green >= 90%</span><span>Amber 70-89%</span><span>Orange < 70%</span>
            </div>
          </div>
        </div>
        <div class="v16-settings-card">
          <div class="v16-kpi-preview">
            <span>Preview KPI Calculation</span>
            <strong id="kpiPreviewValue">92%</strong>
            <p>Sales target achievement preview before saving.</p>
          </div>
          ${settingAction("Save KPI Configuration", "target", "primary")}
        </div>
      </div>
    `);
  }

  function settingsPermissions() {
    const roles = ["Admin", "Manager", "Sales", "Viewer"];
    const permissions = ["Users", "Roles", "Permissions", "Dealer Access", "Company Access", "Menu Visibility", "Read", "Write", "Export"];
    const matrix = permissions.map((permission, index) => `<tr>
      <th>${C.escapeHtml(permission)}</th>
      ${roles.map((role, roleIndex) => `<td>${settingToggle(`${role} ${permission}`, roleIndex === 0 || index < 7 || (role === "Sales" && permission === "Export"))}</td>`).join("")}
    </tr>`).join("");
    return settingSection("settings-permission", "settings", "User & Permission", "Role management.", `
      <div class="v16-settings-card">
        <div class="v16-permission-head">
          ${roles.map(role => `<span>${C.escapeHtml(role)}</span>`).join("")}
        </div>
        <div class="v16-permission-table-wrap">
          <table class="v16-permission-table">
            <thead><tr><th>Role Matrix</th>${roles.map(role => `<th>${C.escapeHtml(role)}</th>`).join("")}</tr></thead>
            <tbody>${matrix}</tbody>
          </table>
        </div>
      </div>
    `, "wide");
  }

  function settingsNotifications() {
    const alerts = ["Sales below target", "Booking overdue", "Collection overdue", "Stock aging", "Landing delayed", "Forecast risk"];
    return settingSection("settings-notifications", "bell", "Notification Center", "Alert management.", `
      <div class="v16-settings-card-grid">
        <div class="v16-settings-card span-2">
          <div class="v16-notification-grid">
            ${alerts.map(alert => settingToggle(alert, true)).join("")}
          </div>
        </div>
        <div class="v16-settings-card">
          ${settingToggle("Email", true)}
          ${settingToggle("Browser", true)}
          ${settingToggle("In-App Notification", true)}
          ${settingToggle("Daily Summary", true)}
          ${settingToggle("Weekly Summary", false)}
        </div>
      </div>
    `);
  }

  function settingsSystem() {
    return settingSection("settings-system", "health", "System", "System configuration.", `
      <div class="v16-settings-card-grid">
        <div class="v16-settings-card span-2">
          <div class="v16-settings-metrics">
            <div><span>Version</span><strong>V16</strong><small>Enterprise</small></div>
            <div><span>Current Build</span><strong>2026.06</strong><small>Administration Center</small></div>
            <div><span>System Health</span><strong>98%</strong><small>operational</small></div>
            <div><span>Database Status</span><strong>Online</strong><small>local JSON</small></div>
            <div><span>Excel Connection</span><strong>Ready</strong><small>import layer</small></div>
            <div><span>API Status</span><strong>Standby</strong><small>no external calls</small></div>
            <div><span>Chart Version</span><strong>Chart.js</strong><small>bundled</small></div>
          </div>
        </div>
        <div class="v16-settings-card">
          ${settingAction("Backup", "export")}
          ${settingAction("Restore", "refresh")}
          ${settingAction("Clear Cache", "refresh")}
          ${settingAction("Export Configuration", "reports", "primary")}
        </div>
      </div>
    `);
  }

  function settingsAbout() {
    return settingSection("settings-about", "reports", "About", "System information.", `
      <div class="v16-settings-card">
        <div class="v16-about-grid">
          <strong>KMM Sales Intelligence</strong>
          <span>Version V16 Enterprise</span>
          <span>Build 2026.06</span>
          <span>Developer KMM Digital Operations</span>
          <span>Release Notes Administration Center, KPI configuration, data management, and permission matrix.</span>
          <span>License Internal Enterprise Use</span>
          <span>Support Contact support@kmm.example</span>
          <span>Copyright 2026 KMM Sales Intelligence</span>
        </div>
      </div>
    `);
  }

  function renderSettings(rows) {
    const sections = [
      ["settings-profile", "User Profile", "team"],
      ["settings-dashboard", "Dashboard Preferences", "focus"],
      ["settings-data", "Data Management", "stock"],
      ["settings-kpi", "KPI Configuration", "target"],
      ["settings-kpi-dictionary", "KPI Dictionary", "target"],
      ["settings-audit-log", "Audit Log", "reports"],
      ["settings-ai", "AI Intelligence Center", "health"],
      ["settings-permission", "User & Permission", "settings"],
      ["settings-notifications", "Notification Center", "bell"],
      ["settings-system", "System", "health"],
      ["settings-about", "About", "reports"]
    ];
    return `<section class="v16-settings-layout">
      <aside class="v16-settings-nav" aria-label="Settings categories">
        <strong>Administration Center</strong>
        ${sections.map((section, index) => `<a href="#${section[0]}" class="${index === 0 ? "is-active" : ""}" data-settings-nav="${section[0]}">${C.icon(section[2])}<span>${C.escapeHtml(section[1])}</span></a>`).join("")}
      </aside>
      <div class="v16-settings-detail">
        ${settingsProfile()}
        ${settingsDashboard(rows)}
        ${settingsDataManagement(rows)}
        ${settingsKpi()}
        ${settingsKpiDictionary()}
        ${settingsAuditLog()}
        ${settingsAiIntelligence()}
        ${settingsPermissions()}
        ${settingsNotifications()}
        ${settingsSystem()}
        ${settingsAbout()}
      </div>
    </section>`;
  }

  function renderFocus(rows) {
    return [
      mission(rows),
      `<section class="v16-grid-top">${focusDirection(rows)}${actionRequired(rows)}${chartCard("Sales Trend (Units)", "salesTrendChart")}</section>`,
      `<section class="v16-grid-bottom">${chartCard("Booking vs Delivery", "bookingDeliveryChart", "short")}${rankCard("Top Dealer", rows, "dealer")}${rankCard("Top Model", rows, "model")}</section>`,
      `<section class="v16-grid-summary">${insight(rows)}${pipelineSummary(rows)}</section>`,
      `<section class="v16-page-band two">${healthPanel(rows)}${missingPanel("Booking vs Delivery Source", ["bookingDate", "deliveryDate", "bookingStatus", "deliveryStatus"])}</section>`
    ].join("");
  }

  function renderSales(rows) {
    return [
      salesDrilldownFilters(),
      salesKpiRow(rows),
      `<section class="v16-page-band two">${salesChartCard("Monthly Sales Trend", "salesTrendChart")}${salesChartCard("Sales vs Target", "salesTargetChart", "Target data not available; showing actual sales only.")}</section>`,
      `<section class="v16-page-band two">${salesChartCard("Sales by Dealer", "salesDealerChart", "", "short")}${salesChartCard("Sales by Salesperson", "salesPersonChart", "", "short")}</section>`,
      `<section class="v16-page-band two">${salesChartCard("Sales by Product Type", "salesTypeChart", "", "short")}${salesChartCard("Sales by Model", "salesModelChart", "", "short")}</section>`,
      `<section class="v16-page-band two">${conversionPanel()}${missingPanel("Pipeline Analysis", ["opportunityStage", "opportunityValue", "expectedCloseDate"])}</section>`,
      `<section class="v16-page-band two">${salesInsight(rows)}${salesActionTable(rows)}</section>`
    ].join("");
  }

  function renderMarket(rows) {
    return [
      `<section class="v16-page-band two">${missingPanel("Lead Funnel", ["leadId", "leadSource", "leadStatus", "qualificationStage"])}${missingPanel("Opportunity Trend", ["opportunityDate", "opportunityStage", "opportunityValue"])}</section>`,
      `<section class="v16-page-band">${movementPanel("Dealer Activity", rows, "dealer")}${missingPanel("Campaign Performance", ["campaignName", "campaignCost", "campaignLeads"])}${missingPanel("Competitor Activity", ["competitorName", "model", "price", "area"])}</section>`,
      `<section class="v16-page-band two">${movementPanel("Area Focus", rows, "region")}${missingPanel("Customer Visit Plan", ["visitDate", "customerName", "visitPlan", "visitOutcome"])}</section>`,
      `<section class="v16-page-band two">${missingPanel("Market Analysis", ["leadId", "opportunityValue", "area"])}${actionList("Action Required", rows)}</section>`
    ].join("");
  }

  function renderStock(rows) {
    return [
      `<section class="v16-page-band">${missingPanel("Current Stock", ["stockOnHand", "stockLocation"])}${missingPanel("Ready to Sell", ["readyToSellQty", "reservedQty"])}${missingPanel("Landing / ETA", ["landingDate", "etaDate", "shipmentStatus"])}</section>`,
      `<section class="v16-page-band">${missingPanel("Stock Aging", ["stockAgeDays", "receivedDate"])}${missingPanel("Back Order", ["backOrderQty", "customerOrderDate"])}${missingPanel("Stock Health", ["stockOnHand", "agingBucket", "readyToSellQty"])}</section>`,
      `<section class="v16-page-band">${movementPanel("Fast Moving", rows, "model")}${movementPanel("Slow Moving", rows.slice().reverse(), "model")}${rankCard("Stock by Model", rows, "model")}</section>`,
      `<section class="v16-page-band two">${rankCard("Stock by Dealer", rows, "dealer")}${actionList("Stock Alert", rows)}</section>`
    ].join("");
  }

  function renderPage(rows) {
    if (state.page === "settings") return renderSettings(rows);
    if (state.page === "focus") return renderFocus(rows);
    if (state.page === "sales") return renderSales(rows);
    if (state.page === "market") return renderMarket(rows);
    if (state.page === "stock") return renderStock(rows);
    if (state.page === "team") return renderTeam(rows);
    if (state.page === "reports") return renderReports(rows);
    const key = state.page === "team" ? "Sales Staff" : state.page === "stock" ? "model" : "dealer";
    return [
      mission(rows),
      `<section class="v16-grid-top">${rankCard(`${PAGE_META[state.page][1].replace(" Dashboard", "")} Ranking`, rows, key)}${actionRequired(rows)}${chartCard("Sales Trend (Units)", "salesTrendChart")}</section>`,
      `<section class="v16-grid-summary">${insight(rows)}${pipelineSummary(rows)}</section>`
    ].join("");
  }

  function monthlySeries(rows) {
    return MONTHS.map((label, index) => {
      const monthRows = rows.filter(row => num(row.month) === index + 1);
      return { label, sales: monthRows.length, profitable: monthRows.filter(row => num(row.gp1) > 0).length, target: null };
    });
  }

  function renderCharts(rows) {
    const series = monthlySeries(rows);
    const compareSeries = state.filters.comparePeriod === "none" ? null : monthlySeries(comparisonRows()).map(item => item.sales);
    Charts.salesTrend("salesTrendChart", series.map(item => item.label), series.map(item => item.sales), compareSeries);
    if ($("#salesTargetChart")) {
      Charts.salesTarget("salesTargetChart", series.map(item => item.label), series.map(item => item.sales), null);
    }
    if ($("#salesDealerChart")) {
      const dealers = topGroups(rows, "dealer", 8);
      Charts.horizontalBar("salesDealerChart", dealers.map(item => item.label), dealers.map(item => item.value), "Sales Records");
    }
    if ($("#salesPersonChart")) {
      const people = topGroups(rows, "Sales Staff", 8);
      Charts.horizontalBar("salesPersonChart", people.map(item => item.label), people.map(item => item.value), "Sales Records");
    }
    if ($("#salesTypeChart")) {
      const types = topGroups(rows, "type", 8);
      Charts.horizontalBar("salesTypeChart", types.map(item => item.label), types.map(item => item.value), "Sales Records");
    }
    if ($("#salesModelChart")) {
      const models = topGroups(rows, "model", 8);
      Charts.horizontalBar("salesModelChart", models.map(item => item.label), models.map(item => item.value), "Sales Records");
    }
    if ($("#bookingDeliveryChart")) {
      Charts.bookingDelivery("bookingDeliveryChart", series.map(item => item.label), series.map(item => item.sales), series.map(item => item.profitable));
    }
    if ($("#teamRankingChart")) {
      const people = staffRows(rows).slice(0, 8);
      Charts.horizontalBar("teamRankingChart", people.map(item => item.label), people.map(item => item.value), "Sales Records");
    }
    if ($("#teamFollowupChart")) {
      Charts.salesTrend("teamFollowupChart", series.map(item => item.label), series.map(item => item.sales), null);
    }
    if ($("#reportCategoryChart")) {
      Charts.simpleBar("reportCategoryChart", ["Sales", "Booking", "Stock", "Team", "Executive"], [rows.length, 0, 0, group(rows, "Sales Staff").length, healthScore(rows)], "Available Signals");
    }
  }

  function render() {
    populateFilters();
    state.filtered = selectedRows();
    const score = healthScore(state.filtered);
    $("#sideMissionScore").textContent = score;
    $("#sideHealthStatus").textContent = score >= 88 ? "Excellent" : score >= 70 ? "Stable" : "Action";
    $(".v16-side-gauge")?.style.setProperty("--score", `${clamp(score, 0, 100)}%`);
    $("#lastUpdatedSide").textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    $("#focusContent").innerHTML = renderPage(state.filtered);
    if (state.page === "settings") bindSettingsInteractions();
    populateFilters();
    const langSelect = $("#v16LanguageSwitcher");
    if (langSelect) langSelect.value = V16Lang.code;
    renderCharts(state.filtered);
  }

  function bindSettingsInteractions() {
    const latest = $("#settingsLatestRefresh");
    if (latest) latest.textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const session = window.KMMSecurity?.settings?.readSettings?.();
    if (session) {
      const avatar = $("#settingsProfileAvatar");
      if (avatar) avatar.textContent = String(session.username || "M").slice(0, 1).toUpperCase();
      const username = $("#settingsUsername");
      if (username) username.value = session.username || "Montree C.";
      const role = $("#settingsRole");
      if (role) role.value = session.role || "";
      const version = $("#settingsVersion");
      if (version) version.value = session.version || "";
      const language = $("#settingsLanguage");
      if (language) language.value = session.language || "th";
      const company = $("#settingsCompany");
      if (company) company.value = session.company || "KMM";
    }
    window.KMMSecurity?.settings?.bindSettingsPage?.();
    const theme = $("#settingsTheme");
    if (theme && !theme.value) theme.value = "Light";
    updateKpiPreview();
    filterSettingsTables();
  }

  function updateKpiPreview() {
    const preview = $("#kpiPreviewValue");
    const target = Number($("#kpiSalesTarget")?.value) || 400;
    const booking = Number($("#kpiBookingTarget")?.value) || 520;
    if (!preview) return;
    preview.textContent = `${Math.min(128, Math.round((booking / target) * 70)).toLocaleString("en-US")}%`;
  }

  function bindControls() {
    document.addEventListener("change", event => {
      const key = event.target?.dataset?.filter;
      if (!key) return;
      state.filters[key] = event.target.value;
      if (key === "company" && window.KMMSecurity?.company?.setSelectedCompany) {
        window.KMMSecurity.company.setSelectedCompany(event.target.value);
      }
      $all(`[data-filter="${key}"]`).forEach(select => { select.value = event.target.value; });
      render();
    });

    document.addEventListener("change", async event => {
      if (event.target?.id !== "v16LanguageSwitcher") return;
      await setLanguage(event.target.value);
    });

    document.addEventListener("click", event => {
      if (event.target?.closest("[data-action='refresh']")) render();
      if (event.target?.closest("[data-action='exportKpiDictionary']")) exportSettingsCsv("kmm-v16-kpi-dictionary.csv", KPI_DICTIONARY);
      if (event.target?.closest("[data-action='exportAuditLog']")) exportSettingsCsv("kmm-v16-audit-log.csv", AUDIT_LOGS);
      if (event.target?.closest("[data-action='export']")) exportCurrentCsv();
      const detail = event.target?.closest("[data-detail-type]");
      if (detail) {
        openSettingsDetail(detail.dataset.detailType, Number(detail.dataset.detailId));
      }
      const nav = event.target?.closest("[data-settings-nav]");
      if (nav) {
        $all("[data-settings-nav]").forEach(item => item.classList.toggle("is-active", item === nav));
      }
      const tab = event.target?.closest("[data-settings-tab]");
      if (tab) {
        const tabName = tab.dataset.settingsTab;
        const section = tab.closest(".v16-settings-section") || document;
        $all("[data-settings-tab]", section).forEach(item => item.classList.toggle("is-active", item === tab));
        $all("[data-settings-panel]", section).forEach(panel => panel.classList.toggle("is-active", panel.dataset.settingsPanel === tabName));
      }
    });

    document.addEventListener("input", event => {
      if (event.target?.id !== "globalSearch") return;
      state.search = event.target.value.trim().toLowerCase();
      render();
    });

    document.addEventListener("input", event => {
      if (["kpiDictionarySearch", "auditLogSearch"].includes(event.target?.id)) filterSettingsTables();
    });

    document.addEventListener("change", event => {
      if (["kpiDictionaryCategory", "auditLogAction"].includes(event.target?.id)) filterSettingsTables();
    });

    document.addEventListener("input", event => {
      if (event.target?.id === "kpiSalesTarget" || event.target?.id === "kpiBookingTarget") updateKpiPreview();
    });
  }

  function filterSettingsTables() {
    const kpiSearch = ($("#kpiDictionarySearch")?.value || "").trim().toLowerCase();
    const kpiCategory = $("#kpiDictionaryCategory")?.value || "all";
    $all("[data-kpi-row]").forEach(row => {
      const matchesSearch = !kpiSearch || (row.dataset.search || "").includes(kpiSearch);
      const matchesCategory = kpiCategory === "all" || row.dataset.category === kpiCategory;
      row.hidden = !(matchesSearch && matchesCategory);
    });

    const auditSearch = ($("#auditLogSearch")?.value || "").trim().toLowerCase();
    const auditAction = $("#auditLogAction")?.value || "all";
    $all("[data-audit-row]").forEach(row => {
      const matchesSearch = !auditSearch || (row.dataset.search || "").includes(auditSearch);
      const matchesAction = auditAction === "all" || row.dataset.actionName === auditAction;
      row.hidden = !(matchesSearch && matchesAction);
    });
  }

  function openSettingsDetail(type, index) {
    const drawer = $("#settingsDetailDrawer");
    if (!drawer) return;
    let title = "";
    let body = "";
    if (type === "kpi") {
      const item = KPI_DICTIONARY[index];
      if (!item) return;
      title = item.name;
      body = `<dl>
        <div><dt>Business Definition</dt><dd>${C.escapeHtml(item.definition)}</dd></div>
        <div><dt>Calculation Formula</dt><dd>${C.escapeHtml(item.formula)}</dd></div>
        <div><dt>Thresholds</dt><dd>Target ${C.escapeHtml(item.target)} / Warning ${C.escapeHtml(item.warning)} / Critical ${C.escapeHtml(item.critical)}</dd></div>
        <div><dt>Data Source</dt><dd>${C.escapeHtml(item.source)}</dd></div>
        <div><dt>Excel Field Mapping</dt><dd>${C.escapeHtml(item.mapping)}</dd></div>
        <div><dt>Owner</dt><dd>${C.escapeHtml(item.owner)}</dd></div>
      </dl>`;
    }
    if (type === "audit") {
      const item = AUDIT_LOGS[index];
      if (!item) return;
      title = `${item.action} / ${item.result}`;
      body = `<dl>
        <div><dt>Date Time</dt><dd>${C.escapeHtml(item.date)} ${C.escapeHtml(item.time)}</dd></div>
        <div><dt>User</dt><dd>${C.escapeHtml(item.user)}</dd></div>
        <div><dt>Company / Dealer</dt><dd>${C.escapeHtml(item.company)} / ${C.escapeHtml(item.dealer)}</dd></div>
        <div><dt>Module</dt><dd>${C.escapeHtml(item.module)}</dd></div>
        <div><dt>IP</dt><dd>${C.escapeHtml(item.ip)}</dd></div>
        <div><dt>Details</dt><dd>${C.escapeHtml(item.details)}</dd></div>
      </dl>`;
    }
    if (type === "ai") {
      const item = AI_MODULES[index];
      if (!item) return;
      title = item.name;
      body = `<dl>
        <div><dt>Provider</dt><dd>${C.escapeHtml(item.provider)}</dd></div>
        <div><dt>Prompt Template</dt><dd>${C.escapeHtml(item.prompt)}</dd></div>
        <div><dt>Prompt Version</dt><dd>${C.escapeHtml(item.version)}</dd></div>
        <div><dt>Model Status</dt><dd>${C.escapeHtml(item.status)}</dd></div>
        <div><dt>Confidence</dt><dd>${C.escapeHtml(item.confidence)}%</dd></div>
        <div><dt>Last AI Run</dt><dd>${C.escapeHtml(item.lastRun)}</dd></div>
      </dl>`;
    }
    drawer.innerHTML = `<div class="v16-detail-drawer-panel"><button type="button" aria-label="Close" data-detail-close>x</button><span>Detail Drawer</span><h3>${C.escapeHtml(title)}</h3>${body}</div>`;
    drawer.classList.add("is-open");
    drawer.querySelector("[data-detail-close]")?.addEventListener("click", () => drawer.classList.remove("is-open"), { once: true });
  }

  function exportSettingsCsv(filename, rows) {
    if (!rows.length) return;
    const columns = Object.keys(rows[0]);
    const csv = [columns.join(",")]
      .concat(rows.map(row => columns.map(column => `"${String(row[column] ?? "").replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCurrentCsv() {
    const rows = state.filtered;
    if (!rows.length) return;
    const columns = Object.keys(rows[0]);
    const csv = [columns.join(",")]
      .concat(rows.map(row => columns.map(column => `"${String(row[column] ?? "").replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kmm-sales-intelligence-v16-${state.page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function hydrateSession() {
    const session = window.KMMSecurity?.auth?.readSession?.();
    if (!session) return;
    const initial = String(session.username || "M").slice(0, 1).toUpperCase();
    ["#userAvatar", "#userAvatarHeader"].forEach(selector => { const el = $(selector); if (el) el.textContent = initial; });
    ["#userName", "#userNameHeader"].forEach(selector => { const el = $(selector); if (el) el.textContent = session.username || "Montree C."; });
    ["#userRole", "#userRoleHeader"].forEach(selector => { const el = $(selector); if (el) el.textContent = session.role || "Sales Division Manager"; });
    state.filters.company = session.company === "KM" ? "KM" : "KMM";
  }

  async function loadRows() {
    const path = window.KMMSecurity?.company?.datasetPath?.() || "data/dashboard_data.json";
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    const rows = await response.json();
    return window.V16DataAdapter ? window.V16DataAdapter.fromRows(rows).rows : rows;
  }

  async function loadLanguage(code) {
    const safeCode = LANG_CODES.includes(code) ? code : "en";
    try {
      const response = await fetch(`lang/${safeCode}.json`);
      V16Lang.dict = response.ok ? await response.json() : {};
      V16Lang.code = safeCode;
      localStorage.setItem("kmm-v16-language", safeCode);
      document.documentElement.lang = safeCode;
    } catch (error) {
      V16Lang.dict = {};
      V16Lang.code = "en";
      document.documentElement.lang = "en";
    }
  }

  async function setLanguage(code) {
    await loadLanguage(code);
    const meta = PAGE_META[state.page] || PAGE_META.focus;
    document.body.innerHTML = C.shell({
      activeKey: state.page,
      navItems: NAV_ITEMS,
      pageTitle: C.t(meta[0], meta[1]),
      pageSubtitle: C.t(meta[2], meta[3]),
      allowExport: state.page === "reports"
    });
    hydrateSession();
    bindSettingsInteractions();
    render();
  }

  async function init() {
    const meta = PAGE_META[state.page] || PAGE_META.focus;
    await loadLanguage(V16Lang.code);
    document.body.innerHTML = C.shell({
      activeKey: state.page,
      navItems: NAV_ITEMS,
      pageTitle: C.t(meta[0], meta[1]),
      pageSubtitle: C.t(meta[2], meta[3]),
      allowExport: state.page === "reports"
    });
    hydrateSession();
    state.rows = await loadRows();
    populateFilters();
    bindControls();
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(error => {
      console.error(error);
      document.body.innerHTML = `<main class="v16-main"><section class="v16-panel"><h3>Data load error</h3><p>${C.escapeHtml(error.message)}</p></section></main>`;
    });
  });
})(window, document);
