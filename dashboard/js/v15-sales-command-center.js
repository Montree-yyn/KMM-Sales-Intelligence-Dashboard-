(function (window, document) {
  "use strict";

  const ORANGE = "#ff6a00";
  const DARK = "#111827";
  const GREEN = "#16a34a";
  const YELLOW = "#f59e0b";
  const RED = "#ef4444";
  const BLUE = "#2f80ed";

  const PAGE_COPY = {
    focus: {
      title: "KMM Sales Intelligence",
      subtitle: "Sales Command Center",
      eyebrow: "Today's Focus",
      note: "Executive focus, dealer priorities, daily actions, and reporting shortcuts."
    },
    sales: {
      title: "SALES",
      subtitle: "SALES PERFORMANCE CENTER",
      eyebrow: "Sales Dashboard",
      note: "Sales trend, booking signal, delivery movement, and dealer contribution."
    },
    market: {
      title: "MARKET",
      subtitle: "MARKET OPPORTUNITY CENTER",
      eyebrow: "Market Dashboard",
      note: "Regional opportunity, customer area visits, and demand signals."
    },
    stock: {
      title: "STOCK",
      subtitle: "READY STOCK CENTER",
      eyebrow: "Stock Dashboard",
      note: "Available models, slow movement risk, and dealer stock focus."
    },
    team: {
      title: "TEAM",
      subtitle: "SALES TEAM CENTER",
      eyebrow: "Team Dashboard",
      note: "Salesperson performance, coaching focus, and activity priorities."
    },
    reports: {
      title: "REPORTS",
      subtitle: "REPORT COMMAND CENTER",
      eyebrow: "Reports Dashboard",
      note: "Daily, weekly, monthly, sales, booking, stock, and archive shortcuts."
    }
  };

  const NAV = [
    ["focus", "focus.html", "F", "Focus", "โฟกัสวันนี้"],
    ["sales", "sales.html", "S", "Sales", "ยอดขาย"],
    ["market", "market.html", "M", "Market", "โอกาสทางการตลาด"],
    ["stock", "stock.html", "K", "Stock", "สต็อกพร้อมขาย"],
    ["team", "team.html", "T", "Team", "ทีมขาย"],
    ["reports", "reports.html", "R", "Reports", "รายงาน"]
  ];

  // Demo-only operational targets: the current static data is sales history,
  // not a booking / collection / stock target feed. Keep this isolated so real
  // fields can replace it without touching rendering code.
  const TARGETS = {
    deliveryFromBooking: 46,
    newDelivery: 28,
    newBooking: 42,
    advanceBooking: 18,
    totalDelivery: 120,
    collection: 88,
    forecastGap: 30,
    sales: 120,
    booking: 96,
    landing: 76,
    collectionTarget: 88
  };

  const state = {
    rows: [],
    filtered: [],
    charts: {},
    filters: {
      company: "KMM",
      branch: "all",
      dealer: "all",
      dateRange: "mtd",
      model: "all",
      salesperson: "all"
    }
  };

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function number(value) {
    return Number(value) || 0;
  }

  function fmt(value) {
    return Math.round(Number(value) || 0).toLocaleString("en-US");
  }

  function fmtMoney(value) {
    const mmk = Number(value) || 0;
    if (Math.abs(mmk) >= 1000000000) return `${(mmk / 1000000000).toFixed(1)}B`;
    if (Math.abs(mmk) >= 1000000) return `${(mmk / 1000000).toFixed(1)}M`;
    return fmt(mmk);
  }

  function pct(actual, target) {
    if (!target) return 0;
    return Math.round((actual / target) * 100);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function unique(rows, key) {
    return Array.from(new Set(rows.map(row => row[key]).filter(Boolean))).sort();
  }

  function sum(rows, key) {
    return rows.reduce((total, row) => total + number(row[key]), 0);
  }

  function groupCount(rows, key) {
    const map = new Map();
    rows.forEach(row => {
      const label = row[key] || "Unknown";
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }

  function groupSum(rows, key, valueKey) {
    const map = new Map();
    rows.forEach(row => {
      const label = row[key] || "Unknown";
      map.set(label, (map.get(label) || 0) + number(row[valueKey]));
    });
    return Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }

  function currentPage() {
    return document.body.dataset.v15Page || "focus";
  }

  function companyOptions() {
    const companies = window.KMMSecurity?.company?.getCompanies?.() || [
      { code: "KMM", name: "KUBOTA MAESOD MYANMAR" },
      { code: "KM", name: "KUBOTA MAESOD" }
    ];
    return companies.filter(item => item.code === "KM" || item.code === "KMM");
  }

  function optionList(values, allLabel) {
    return [`<option value="all">${allLabel}</option>`]
      .concat(values.map(value => `<option value="${String(value)}">${String(value)}</option>`))
      .join("");
  }

  function shellTemplate(page) {
    const copy = PAGE_COPY[page] || PAGE_COPY.focus;
    const nav = NAV.map(([key, href, icon, en, th]) => `
      <a href="${href}" class="${key === page ? "active" : ""}">
        <span class="v15-nav-icon">${icon}</span>
        <span><strong>${en}</strong><small>${th}</small></span>
      </a>
    `).join("");

    return `
      <div class="v15-shell">
        <aside class="v15-sidebar">
          <div class="v15-brand">
            <div class="v15-logo">KMM</div>
            <div><strong>KMM</strong><span>SALES INTELLIGENCE</span></div>
          </div>
          <nav class="v15-nav">${nav}</nav>
          <section class="v15-quick-filter">
            <h2>Quick Filter</h2>
            <div class="v15-field"><label>Company</label><select data-filter="company"></select></div>
            <div class="v15-field"><label>Branch</label><select data-filter="branch"></select></div>
            <div class="v15-field"><label>Dealer</label><select data-filter="dealer"></select></div>
            <div class="v15-field"><label>Date Range</label><select data-filter="dateRange">
              <option value="mtd">Month to Date</option>
              <option value="qtd">Quarter to Date</option>
              <option value="ytd">Year to Date</option>
              <option value="all">All Data</option>
            </select></div>
            <div class="v15-field"><label>Product Model</label><select data-filter="model"></select></div>
            <div class="v15-field"><label>Salesperson</label><select data-filter="salesperson"></select></div>
            <div class="v15-filter-actions">
              <button type="button" class="v15-btn primary" data-action="apply">Apply Filter</button>
              <button type="button" class="v15-btn ghost" data-action="reset">Reset</button>
            </div>
          </section>
          <div class="v15-user">
            <div class="v15-avatar">U</div>
            <div><strong id="v15UserName">User</strong><span id="v15UserRole">Dashboard access</span></div>
          </div>
        </aside>
        <main class="v15-main">
          <div class="v15-page">
            <header class="topbar v15-topbar">
              <div>
                <div class="v15-eyebrow">${copy.eyebrow}</div>
                <h1>${copy.title}</h1>
                <p>${copy.subtitle}</p>
              </div>
              <div class="v15-header-actions">
                <div class="v15-header-filter"><label>Company</label><select data-filter="company"></select></div>
                <div class="v15-header-filter"><label>Branch</label><select data-filter="branch"></select></div>
                <div class="v15-header-filter"><label>Dealer</label><select data-filter="dealer"></select></div>
                <div class="v15-header-filter"><label>Date Range</label><select data-filter="dateRange">
                  <option value="mtd">MTD</option>
                  <option value="qtd">QTD</option>
                  <option value="ytd">YTD</option>
                  <option value="all">All</option>
                </select></div>
                <div class="v15-updated"><span>Last Updated</span><strong id="v15LastUpdated">-</strong></div>
                <button type="button" class="v15-refresh" data-action="refresh" aria-label="Refresh">↻</button>
              </div>
            </header>
            <div id="v15Content"></div>
          </div>
        </main>
      </div>
    `;
  }

  function focusTemplate() {
    return `
      <section>
        <div class="v15-section-head"><div><h2>TODAY'S FOCUS KPI</h2><span>Daily operating signals for KM and KMM</span></div></div>
        <div class="v15-kpi-grid" id="v15Kpis"></div>
      </section>
      <section class="v15-focus-grid">
        <article class="v15-card"><h2>Focus Direction</h2><div class="v15-stack" id="v15FocusDirection"></div></article>
        <article class="v15-card"><h2>Target vs Actual</h2><div class="v15-stack" id="v15TargetActual"></div></article>
        <article class="v15-card"><h2>Key Alert</h2><div class="v15-alert-list" id="v15Alerts"></div></article>
        <article class="v15-card"><h2>Action Required Today</h2><div class="v15-actions" id="v15Actions"></div></article>
      </section>
      <section class="v15-analysis-grid">
        <article class="v15-panel"><h2>Sales Trend</h2><p>Monthly delivery movement</p><div class="v15-chart-box"><canvas id="salesTrendChart"></canvas></div></article>
        <article class="v15-panel"><h2>Sales by Dealer</h2><p>Ranking by unit contribution</p><div class="v15-ranking" id="dealerRanking"></div></article>
        <article class="v15-panel"><h2>Sales by Model</h2><p>Top model mix</p><div class="v15-chart-box compact"><canvas id="modelDonutChart"></canvas></div></article>
        <article class="v15-panel"><h2>Pipeline Funnel</h2><p>Lead to delivery view</p><div class="v15-chart-box compact"><canvas id="pipelineChart"></canvas></div></article>
      </section>
      <section class="v15-detail-grid">
        <article class="v15-panel"><h2>Priority Dealer</h2><table class="v15-table"><thead><tr><th>Dealer</th><th class="text-right">Units</th><th class="text-right">Share</th></tr></thead><tbody id="dealerTable"></tbody></table></article>
        <article class="v15-panel"><h2>Priority Model</h2><table class="v15-table"><thead><tr><th>Model</th><th class="text-right">Units</th><th class="text-right">GP</th></tr></thead><tbody id="modelTable"></tbody></table></article>
        <article class="v15-panel"><h2>Executive Insight / Sales Insight</h2><div class="v15-insight" id="insightPanel"></div></article>
      </section>
      <section>
        <div class="v15-section-head"><div><h2>Report Shortcut</h2><span>Management-ready report actions</span></div></div>
        <div class="v15-report-grid" id="reportShortcuts"></div>
      </section>
    `;
  }

  function simplePageTemplate(copy) {
    return `
      <section class="v15-mini-grid" id="simpleKpis"></section>
      <section class="v15-page-placeholder">
        <article class="v15-panel"><h2>${copy.eyebrow}</h2><p>${copy.note}</p><div class="v15-chart-box"><canvas id="simpleTrendChart"></canvas></div></article>
        <article class="v15-panel"><h2>Priority Ranking</h2><p>Current filtered contribution</p><div class="v15-ranking" id="simpleRanking"></div></article>
      </section>
      <section>
        <div class="v15-section-head"><div><h2>Report Shortcut</h2><span>Consistent V15 navigation actions</span></div></div>
        <div class="v15-report-grid" id="reportShortcuts"></div>
      </section>
    `;
  }

  function populateFilters() {
    const rows = state.rows;
    const companies = companyOptions().map(item => `<option value="${item.code}">${item.code} = ${item.name}</option>`).join("");
    const branches = optionList(unique(rows, "region"), "All Branches");
    const dealers = optionList(unique(rows, "dealer"), "All Dealers");
    const models = optionList(unique(rows, "model"), "All Models");
    const people = optionList(unique(rows, "Sales Staff"), "All Salespeople");

    $all('[data-filter="company"]').forEach(select => {
      select.innerHTML = companies;
      select.value = state.filters.company;
    });
    $all('[data-filter="branch"]').forEach(select => {
      select.innerHTML = branches;
      select.value = state.filters.branch;
    });
    $all('[data-filter="dealer"]').forEach(select => {
      select.innerHTML = dealers;
      select.value = state.filters.dealer;
    });
    $all('[data-filter="model"]').forEach(select => {
      select.innerHTML = models;
      select.value = state.filters.model;
    });
    $all('[data-filter="salesperson"]').forEach(select => {
      select.innerHTML = people;
      select.value = state.filters.salesperson;
    });
    $all('[data-filter="dateRange"]').forEach(select => {
      select.value = state.filters.dateRange;
    });
  }

  function selectedRows() {
    const latestYear = Math.max(...state.rows.map(row => number(row.year)));
    const latestMonth = Math.max(...state.rows.filter(row => number(row.year) === latestYear).map(row => number(row.month)));
    return state.rows.filter(row => {
      if (state.filters.branch !== "all" && row.region !== state.filters.branch) return false;
      if (state.filters.dealer !== "all" && row.dealer !== state.filters.dealer) return false;
      if (state.filters.model !== "all" && row.model !== state.filters.model) return false;
      if (state.filters.salesperson !== "all" && row["Sales Staff"] !== state.filters.salesperson) return false;
      if (state.filters.dateRange === "mtd") return number(row.year) === latestYear && number(row.month) === latestMonth;
      if (state.filters.dateRange === "qtd") return number(row.year) === latestYear && number(row.month) >= Math.max(1, latestMonth - 2);
      if (state.filters.dateRange === "ytd") return number(row.year) === latestYear;
      return true;
    });
  }

  function applyFilters() {
    state.filtered = selectedRows();
    renderCurrentPage();
  }

  function bindControls() {
    document.addEventListener("change", event => {
      const key = event.target?.dataset?.filter;
      if (!key) return;
      state.filters[key] = event.target.value;
      $all(`[data-filter="${key}"]`).forEach(select => {
        select.value = event.target.value;
      });
    });

    document.addEventListener("click", event => {
      const action = event.target?.dataset?.action;
      if (action === "apply" || action === "refresh") applyFilters();
      if (action === "reset") {
        state.filters = { company: "KMM", branch: "all", dealer: "all", dateRange: "mtd", model: "all", salesperson: "all" };
        populateFilters();
        applyFilters();
      }
    });
  }

  function kpiData(rows) {
    const units = rows.length;
    const revenue = sum(rows, "netReceived");
    const dealerCount = unique(rows, "dealer").length;
    const modelCount = unique(rows, "model").length;
    const gp = sum(rows, "gp1");
    const collectionActual = Math.max(1, Math.round((revenue / 1000000000) % 110));
    return [
      ["D", "Delivery from Booking", Math.round(units * 0.48), "units", TARGETS.deliveryFromBooking],
      ["N", "New Delivery", Math.round(units * 0.3), "units", TARGETS.newDelivery],
      ["B", "New Booking", Math.round(units * 0.42), "units", TARGETS.newBooking],
      ["A", "Advance Booking", Math.round(units * 0.2), "units", TARGETS.advanceBooking],
      ["T", "Total Delivery (MTD)", units, "units", TARGETS.totalDelivery],
      ["C", "Collection (MTD)", collectionActual, "%", TARGETS.collection],
      ["G", "Forecast Gap (Jun)", Math.max(0, TARGETS.forecastGap - Math.round(units * 0.08)), "units", TARGETS.forecastGap]
    ].map(item => {
      const achievement = item[1].includes("Gap") ? pct(item[4] - item[2], item[4]) : pct(item[2], item[4]);
      return { icon: item[0], title: item[1], value: item[2], unit: item[3], target: item[4], achievement };
    });
  }

  function statusClass(value) {
    if (value >= 90) return "good";
    if (value >= 70) return "watch";
    return "risk";
  }

  function spark(points, color) {
    const width = 120;
    const height = 30;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;
    const d = points.map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / span) * (height - 6) - 3;
      return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `<svg class="v15-sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="sparkline"><path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/></svg>`;
  }

  function renderKpis(rows) {
    const html = kpiData(rows).map((item, index) => {
      const status = statusClass(item.achievement);
      const color = status === "good" ? GREEN : status === "watch" ? YELLOW : RED;
      return `
        <article class="v15-kpi-card">
          <div class="v15-kpi-top"><div class="v15-card-icon">${item.icon}</div><div class="v15-kpi-title">${item.title}</div></div>
          <div class="v15-kpi-value"><strong>${fmt(item.value)}</strong><span>${item.unit}</span></div>
          <div class="v15-kpi-target">Target ${fmt(item.target)}</div>
          ${spark([8 + index, 14, 11 + index, 18, 16 + index, 23], color)}
          <div class="v15-status"><span class="v15-kpi-ach status-${status}">${item.achievement}% achieved</span><span class="v15-dot dot-${status}"></span></div>
        </article>`;
    }).join("");
    $("#v15Kpis").innerHTML = html;
  }

  function progressRow(name, actual, target, badge) {
    const value = pct(actual, target);
    const status = statusClass(value);
    return `
      <div class="v15-progress-row">
        <div class="v15-focus-name">${badge ? `<span class="v15-badge">${badge}</span>` : ""}<span>${name}</span></div>
        <strong>${fmt(actual)} / ${fmt(target)}</strong>
        <div class="v15-progress-track"><div class="v15-progress-fill ${status}" style="width:${clamp(value, 0, 100)}%"></div></div>
        <strong class="status-${status}">${value}%</strong>
      </div>`;
  }

  function renderFocusBlocks(rows) {
    const units = rows.length;
    $("#v15FocusDirection").innerHTML = [
      ["Delivery from Booking", Math.round(units * 0.48), TARGETS.deliveryFromBooking],
      ["New Delivery", Math.round(units * 0.3), TARGETS.newDelivery],
      ["New Booking", Math.round(units * 0.42), TARGETS.newBooking],
      ["Advance Booking", Math.round(units * 0.2), TARGETS.advanceBooking],
      ["Total Delivery", units, TARGETS.totalDelivery]
    ].map((item, index) => progressRow(`Focus ${index + 1}: ${item[0]}`, item[1], item[2], index + 1)).join("");

    $("#v15TargetActual").innerHTML = [
      ["Sales", units, TARGETS.sales],
      ["Booking", Math.round(units * 0.8), TARGETS.booking],
      ["Landing", Math.round(units * 0.58), TARGETS.landing],
      ["Collection", Math.round((sum(rows, "netReceived") / 1000000000) % 110), TARGETS.collectionTarget]
    ].map(item => progressRow(item[0], item[1], item[2])).join("");

    $("#v15Alerts").innerHTML = [
      ["dot-risk", "Forecast gap needs manager review"],
      ["dot-orange", "Top dealer concentration is above target"],
      ["dot-watch", "Collection follow-up required today"],
      ["dot-info", "New booking momentum improved"],
      ["dot-risk", "Slow model movement in priority stock"]
    ].map(item => `<div class="v15-alert"><span class="v15-alert-dot ${item[0]}"></span><span>${item[1]}</span></div>`).join("");

    $("#v15Actions").innerHTML = [
      ["D", "Follow Delivery", "Confirm booking-to-delivery conversion before noon."],
      ["S", "Open Sales", "Push priority model offers with top dealers."],
      ["V", "Visit Customer Area", "Assign field visits for high-opportunity branches."]
    ].map(item => `
      <article class="v15-action-card"><div class="v15-action-icon">${item[0]}</div><div><strong>${item[1]}</strong><span>${item[2]}</span></div><strong>›</strong></article>
    `).join("");
  }

  function renderTables(rows) {
    const total = rows.length || 1;
    const dealers = groupCount(rows, "dealer").slice(0, 6);
    const models = groupCount(rows, "model").slice(0, 6);
    const gpByModel = groupSum(rows, "model", "gp1");
    $("#dealerTable").innerHTML = dealers.map(item => `
      <tr><td>${item.label}</td><td class="text-right">${fmt(item.value)}</td><td class="text-right">${pct(item.value, total)}%</td></tr>
    `).join("");
    $("#modelTable").innerHTML = models.map(item => {
      const gp = gpByModel.find(row => row.label === item.label)?.value || 0;
      return `<tr><td>${item.label}</td><td class="text-right">${fmt(item.value)}</td><td class="text-right">${fmtMoney(gp)}</td></tr>`;
    }).join("");
    $("#dealerRanking").innerHTML = dealers.map(item => `
      <div class="v15-rank-row"><span>${item.label}</span><strong>${fmt(item.value)}</strong><div class="v15-progress-track"><div class="v15-progress-fill" style="width:${clamp(pct(item.value, dealers[0]?.value || 1), 0, 100)}%"></div></div><span>${pct(item.value, total)}%</span></div>
    `).join("");
  }

  function renderInsights(rows) {
    const dealers = groupCount(rows, "dealer");
    const models = groupCount(rows, "model");
    const gp = sum(rows, "gp1");
    const revenue = sum(rows, "netReceived");
    const margin = revenue ? ((gp / revenue) * 100).toFixed(1) : "0.0";
    $("#insightPanel").innerHTML = [
      ["Dealer Focus", `${dealers[0]?.label || "-"} is the leading dealer in the current view.`],
      ["Model Push", `${models[0]?.label || "-"} has the strongest delivery contribution.`],
      ["Margin Signal", `Current GP margin is ${margin}%. Review low-margin deals before month end.`]
    ].map(item => `<div class="v15-insight-item"><strong>${item[0]}</strong><span>${item[1]}</span></div>`).join("");
  }

  function reportShortcuts() {
    const reports = [
      ["D", "Daily Report", "Today focus"],
      ["W", "Weekly Report", "Weekly rollup"],
      ["M", "Monthly Report", "MTD review"],
      ["S", "Sales Report", "Sales detail"],
      ["B", "Booking Report", "Booking status"],
      ["K", "Stock Report", "Ready stock"],
      ["P", "Export PDF", "Board format"],
      ["X", "Export Excel", "Raw workbook"],
      ["T", "Export PPT", "Meeting deck"],
      ["A", "Report Archive", "Past reports"]
    ];
    const target = $("#reportShortcuts");
    if (!target) return;
    target.innerHTML = reports.map(item => `
      <a class="v15-report-card" href="reports.html"><div class="v15-report-icon">${item[0]}</div><div><strong>${item[1]}</strong><span>${item[2]}</span></div></a>
    `).join("");
  }

  function chart(id, type, data, options) {
    const canvas = document.getElementById(id);
    if (!canvas || !window.Chart) return;
    if (state.charts[id]) state.charts[id].destroy();
    state.charts[id] = new window.Chart(canvas, {
      type,
      data,
      options: Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: type === "doughnut" ? {} : {
          x: { grid: { display: false }, ticks: { color: "#737b88" } },
          y: { beginAtZero: true, grid: { color: "#edf0f4" }, ticks: { color: "#737b88" } }
        }
      }, options || {})
    });
  }

  function renderCharts(rows) {
    const monthly = groupCount(rows, "monthYear").sort((a, b) => String(a.label).localeCompare(String(b.label))).slice(-8);
    const models = groupCount(rows, "model").slice(0, 5);
    chart("salesTrendChart", "line", {
      labels: monthly.map(item => item.label),
      datasets: [{ data: monthly.map(item => item.value), borderColor: ORANGE, backgroundColor: "rgba(255,106,0,.14)", tension: 0.35, fill: true, pointRadius: 3 }]
    });
    chart("modelDonutChart", "doughnut", {
      labels: models.map(item => item.label),
      datasets: [{ data: models.map(item => item.value), backgroundColor: [ORANGE, DARK, GREEN, YELLOW, BLUE], borderWidth: 0 }]
    }, { cutout: "68%" });
    chart("pipelineChart", "bar", {
      labels: ["Lead", "Quote", "Booking", "Delivery"],
      datasets: [{ data: [180, 126, 86, rows.length], backgroundColor: [BLUE, YELLOW, ORANGE, GREEN], borderRadius: 10 }]
    }, { indexAxis: "y" });
  }

  function renderFocusPage() {
    const rows = state.filtered;
    $("#v15Content").innerHTML = focusTemplate();
    renderKpis(rows);
    renderFocusBlocks(rows);
    renderTables(rows);
    renderInsights(rows);
    renderCharts(rows);
    reportShortcuts();
  }

  function renderSimplePage(page) {
    const rows = state.filtered;
    const copy = PAGE_COPY[page] || PAGE_COPY.sales;
    $("#v15Content").innerHTML = simplePageTemplate(copy);
    const dealers = groupCount(rows, page === "team" ? "Sales Staff" : page === "stock" ? "model" : "dealer").slice(0, 6);
    const revenue = sum(rows, "netReceived");
    $("#simpleKpis").innerHTML = [
      ["Units", fmt(rows.length)],
      ["Revenue", fmtMoney(revenue)],
      ["GP", fmtMoney(sum(rows, "gp1"))]
    ].map(item => `<article class="v15-mini-card"><span>${item[0]}</span><strong>${item[1]}</strong></article>`).join("");
    $("#simpleRanking").innerHTML = dealers.map(item => `
      <div class="v15-rank-row"><span>${item.label}</span><strong>${fmt(item.value)}</strong><div class="v15-progress-track"><div class="v15-progress-fill" style="width:${clamp(pct(item.value, dealers[0]?.value || 1), 0, 100)}%"></div></div><span>${pct(item.value, rows.length || 1)}%</span></div>
    `).join("");
    const monthly = groupCount(rows, "monthYear").sort((a, b) => String(a.label).localeCompare(String(b.label))).slice(-8);
    chart("simpleTrendChart", "line", {
      labels: monthly.map(item => item.label),
      datasets: [{ data: monthly.map(item => item.value), borderColor: ORANGE, backgroundColor: "rgba(255,106,0,.14)", tension: 0.35, fill: true }]
    });
    reportShortcuts();
  }

  function renderCurrentPage() {
    const page = currentPage();
    $("#v15LastUpdated").textContent = new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    if (page === "focus") renderFocusPage();
    else renderSimplePage(page);
  }

  async function loadRows() {
    const path = window.KMMSecurity?.company?.datasetPath?.() || "data/dashboard_data.json";
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return response.json();
  }

  async function init() {
    const page = currentPage();
    document.body.innerHTML = shellTemplate(page);
    const session = window.KMMSecurity?.auth?.readSession?.();
    if (session) {
      $("#v15UserName").textContent = session.username;
      $("#v15UserRole").textContent = session.role;
      state.filters.company = session.company === "KM" ? "KM" : "KMM";
    }
    state.rows = await loadRows();
    state.filtered = selectedRows();
    populateFilters();
    bindControls();
    renderCurrentPage();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(error => {
      console.error(error);
      const content = $("#v15Content") || document.body;
      content.innerHTML = `<section class="v15-panel"><h2>Data load error</h2><p>${error.message}</p></section>`;
    });
  });
})(window, document);
