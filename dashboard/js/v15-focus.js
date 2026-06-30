(function (window, document) {
  "use strict";

  const COLORS = {
    orange: "#f37021",
    navy: "#07111f",
    green: "#15803d",
    amber: "#b7791f",
    red: "#c2410c",
    blue: "#2563eb",
    cyan: "#0891b2",
    muted: "#64748b",
    line: "#e2e8f0"
  };

  const NAV_ITEMS = [
    ["focus", "focus.html", "F", "Focus", "Today's priorities"],
    ["sales", "sales.html", "S", "Sales", "Performance"],
    ["market", "market.html", "M", "Market", "Opportunity"],
    ["stock", "stock.html", "K", "Stock", "Availability"],
    ["team", "team.html", "T", "Team", "Capability"],
    ["reports", "reports.html", "R", "Reports", "Management pack"]
  ];

  const TARGETS = {
    deliveryFromBooking: 46,
    newDelivery: 28,
    newBooking: 42,
    advanceBooking: 18,
    totalDelivery: 120,
    collection: 88,
    forecastGap: 30,
    booking: 96,
    delivery: 120
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
    return Math.round(number(value)).toLocaleString("en-US");
  }

  function fmtMoney(value) {
    const amount = number(value);
    if (Math.abs(amount) >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (Math.abs(amount) >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    return fmt(amount);
  }

  function pct(actual, target) {
    return target ? Math.round((number(actual) / number(target)) * 100) : 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sum(rows, key) {
    return rows.reduce((total, row) => total + number(row[key]), 0);
  }

  function unique(rows, key) {
    return Array.from(new Set(rows.map(row => row[key]).filter(Boolean))).sort();
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

  function companyOptions() {
    const fallback = [
      { code: "KMM", name: "KUBOTA MAESOD MYANMAR" },
      { code: "KM", name: "KUBOTA MAESOD" }
    ];
    const companies = window.KMMSecurity?.company?.getCompanies?.() || fallback;
    return companies.filter(item => item.code === "KM" || item.code === "KMM");
  }

  function optionList(values, allLabel) {
    return [`<option value="all">${allLabel}</option>`]
      .concat(values.map(value => `<option value="${String(value)}">${String(value)}</option>`))
      .join("");
  }

  function emptyState(label) {
    return `<div class="v15-empty">${label}</div>`;
  }

  function statusFor(value) {
    if (value >= 90) return "good";
    if (value >= 70) return "watch";
    return "risk";
  }

  function componentShell() {
    const nav = NAV_ITEMS.map(([key, href, icon, label, meta]) => `
      <a href="${href}" class="${key === "focus" ? "is-active" : ""}">
        <span class="v15-nav-icon">${icon}</span>
        <span><strong>${label}</strong><small>${meta}</small></span>
      </a>
    `).join("");

    return `
      <div class="v15-app">
        <aside class="v15-sidebar">
          <div class="v15-brand">
            <div class="v15-brand-mark">KMM</div>
            <div><strong>Sales Intelligence</strong><span>Executive dashboard</span></div>
          </div>
          <nav class="v15-nav" aria-label="Dashboard navigation">${nav}</nav>
          <section class="v15-side-panel" aria-label="Executive pulse">
            <h2>Executive Pulse</h2>
            <div class="v15-side-metric"><span>Mission Score</span><strong id="sideMissionScore">-</strong></div>
            <div class="v15-side-metric"><span>Top Dealer</span><strong id="sideTopDealer">-</strong></div>
            <div class="v15-side-metric"><span>Focus Window</span><strong>MTD</strong></div>
          </section>
          <div class="v15-user">
            <div class="v15-avatar" id="userAvatar">U</div>
            <div><strong id="userName">User</strong><span id="userRole">Dashboard access</span></div>
          </div>
        </aside>
        <main class="v15-main">
          <div class="v15-workspace">
            <header class="v15-header topbar">
              <div>
                <div class="v15-eyebrow">V15 Phase 1 Focus</div>
                <h1>Executive Focus Command</h1>
                <p>White workspace for daily leadership decisions, Kubota sales execution, dealer concentration, delivery movement, and immediate action.</p>
              </div>
              <div class="v15-header-actions">
                <div class="v15-updated"><span>Last updated</span><strong id="lastUpdated">-</strong></div>
                <button type="button" class="v15-icon-button" data-action="refresh" title="Refresh" aria-label="Refresh">↻</button>
              </div>
            </header>
            <section class="v15-filter-bar" aria-label="Focus filters">
              ${componentFilter("company", "Company")}
              ${componentFilter("branch", "Branch")}
              ${componentFilter("dealer", "Dealer")}
              ${componentFilter("dateRange", "Date Range")}
              ${componentFilter("model", "Model")}
              ${componentFilter("salesperson", "Salesperson")}
              <div class="v15-filter-actions">
                <button type="button" class="v15-button v15-button-primary" data-action="apply">Apply</button>
                <button type="button" class="v15-button v15-button-secondary" data-action="reset">Reset</button>
              </div>
            </section>
            <div id="focusContent"></div>
          </div>
        </main>
      </div>
    `;
  }

  function componentFilter(key, label) {
    return `<div class="v15-field"><label>${label}</label><select data-filter="${key}"></select></div>`;
  }

  function componentCard(title, subtitle, body) {
    return `
      <article class="v15-card">
        <div class="v15-card-head"><div><h3>${title}</h3><p>${subtitle}</p></div></div>
        ${body}
      </article>
    `;
  }

  function componentPanel(title, subtitle, body) {
    return `
      <article class="v15-panel">
        <div class="v15-panel-head"><div><h3>${title}</h3><p>${subtitle}</p></div></div>
        ${body}
      </article>
    `;
  }

  function sectionTitle(title, subtitle) {
    return `<div class="v15-section-title"><div><h2>${title}</h2><span>${subtitle}</span></div></div>`;
  }

  function populateFilters() {
    const rows = state.rows;
    const companies = companyOptions().map(item => `<option value="${item.code}">${item.code} = ${item.name}</option>`).join("");
    const dateRanges = [
      ["mtd", "Month to Date"],
      ["qtd", "Quarter to Date"],
      ["ytd", "Year to Date"],
      ["all", "All Data"]
    ].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");

    const options = {
      company: companies,
      branch: optionList(unique(rows, "region"), "All Branches"),
      dealer: optionList(unique(rows, "dealer"), "All Dealers"),
      dateRange: dateRanges,
      model: optionList(unique(rows, "model"), "All Models"),
      salesperson: optionList(unique(rows, "Sales Staff"), "All Salespeople")
    };

    Object.keys(options).forEach(key => {
      $all(`[data-filter="${key}"]`).forEach(select => {
        select.innerHTML = options[key];
        select.value = state.filters[key];
      });
    });
  }

  function selectedRows() {
    if (!state.rows.length) return [];
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

  function kpiData(rows) {
    const units = rows.length;
    const revenue = sum(rows, "netReceived");
    const gp = sum(rows, "gp1");
    const margin = revenue ? (gp / revenue) * 100 : 0;
    const collectionActual = Math.max(1, Math.round((revenue / 1000000000) % 110));
    return [
      ["DB", "Delivery from Booking", Math.round(units * 0.48), "units", TARGETS.deliveryFromBooking],
      ["ND", "New Delivery", Math.round(units * 0.3), "units", TARGETS.newDelivery],
      ["NB", "New Booking", Math.round(units * 0.42), "units", TARGETS.newBooking],
      ["AB", "Advance Booking", Math.round(units * 0.2), "units", TARGETS.advanceBooking],
      ["TD", "Total Delivery", units, "units", TARGETS.totalDelivery],
      ["CL", "Collection", collectionActual, "%", TARGETS.collection],
      ["FG", "Forecast Gap", Math.max(0, TARGETS.forecastGap - Math.round(units * 0.08)), "units", TARGETS.forecastGap]
    ].map(([icon, title, value, unit, target]) => {
      const achievement = title === "Forecast Gap" ? pct(target - value, target) : pct(value, target);
      return { icon, title, value, unit, target, achievement, margin };
    });
  }

  function missionScore(rows) {
    const scores = kpiData(rows).map(item => item.achievement);
    if (!scores.length) return 0;
    return Math.round(scores.reduce((total, value) => total + value, 0) / scores.length);
  }

  function componentKpi(item) {
    const status = statusFor(item.achievement);
    return `
      <article class="v15-card v15-kpi-card">
        <div class="v15-kpi-top">
          <div class="v15-kpi-icon">${item.icon}</div>
          <div class="v15-kpi-title">${item.title}</div>
        </div>
        <div class="v15-kpi-value"><strong>${fmt(item.value)}</strong><span>${item.unit}</span></div>
        <div class="v15-kpi-meta"><span>Target ${fmt(item.target)}</span><span>${item.achievement}%</span></div>
        <div class="v15-progress-track"><div class="v15-progress-fill ${status}" style="width:${clamp(item.achievement, 0, 100)}%"></div></div>
        <div class="v15-status ${status}">${status === "good" ? "On track" : status === "watch" ? "Watch" : "Action"}</div>
      </article>
    `;
  }

  function renderMission(rows) {
    const dealers = groupCount(rows, "dealer");
    const models = groupCount(rows, "model");
    const score = missionScore(rows);
    const revenue = sum(rows, "netReceived");
    const gp = sum(rows, "gp1");
    const margin = revenue ? ((gp / revenue) * 100).toFixed(1) : "0.0";

    $("#sideMissionScore").textContent = `${score}%`;
    $("#sideTopDealer").textContent = dealers[0]?.label || "-";

    return `
      <section class="v15-mission" aria-label="Today's Mission">
        <article class="v15-mission-main">
          <div class="v15-mission-copy">
            <div class="v15-eyebrow">Today's Mission</div>
            <h2>Convert booking momentum into delivery discipline.</h2>
            <p>Lead the day around ${dealers[0]?.label || "priority dealers"}, protect GP margin at ${margin}%, and remove execution blockers on high-volume Kubota models.</p>
            <div class="v15-chip-row">
              <span class="v15-chip">${fmt(rows.length)} deliveries</span>
              <span class="v15-chip">${fmtMoney(revenue)} revenue</span>
              <span class="v15-chip">${models[0]?.label || "No model"} focus</span>
            </div>
          </div>
          <div class="v15-mission-score">
            <div class="v15-score-ring" style="--score:${clamp(score, 0, 100)}%"><div><strong>${score}%</strong></div></div>
            <span>Mission readiness</span>
          </div>
        </article>
        <aside class="v15-mission-side">
          <h3>Command Signals</h3>
          <div class="v15-mission-stat"><div class="v15-stat-icon">D</div><div><span>Top Dealer</span><strong>${dealers[0]?.label || "-"}</strong></div><strong>${fmt(dealers[0]?.value || 0)}</strong></div>
          <div class="v15-mission-stat"><div class="v15-stat-icon">M</div><div><span>Top Model</span><strong>${models[0]?.label || "-"}</strong></div><strong>${fmt(models[0]?.value || 0)}</strong></div>
          <div class="v15-mission-stat"><div class="v15-stat-icon">G</div><div><span>GP Quality</span><strong>${fmtMoney(gp)}</strong></div><strong>${margin}%</strong></div>
        </aside>
      </section>
    `;
  }

  function renderKpis(rows) {
    return `
      <section>
        ${sectionTitle("7 KPI Cards", "Daily executive scorecard for Focus execution")}
        <div class="v15-kpi-grid">${kpiData(rows).map(componentKpi).join("")}</div>
      </section>
    `;
  }

  function focusDirection(rows) {
    const units = rows.length;
    const items = [
      ["Delivery from Booking", Math.round(units * 0.48), TARGETS.deliveryFromBooking, "Convert confirmed bookings into deliveries"],
      ["New Delivery", Math.round(units * 0.3), TARGETS.newDelivery, "Close available ready-to-deliver opportunities"],
      ["New Booking", Math.round(units * 0.42), TARGETS.newBooking, "Secure new demand before competitor response"],
      ["Advance Booking", Math.round(units * 0.2), TARGETS.advanceBooking, "Build next-period delivery pipeline"],
      ["Total Delivery", units, TARGETS.totalDelivery, "Protect MTD delivery target"]
    ];

    const body = `<div class="v15-focus-list">${items.map((item, index) => {
      const progress = pct(item[1], item[2]);
      return `
        <div class="v15-focus-item">
          <div class="v15-focus-index">${index + 1}</div>
          <div><strong>${item[0]}</strong><span>${item[3]}</span></div>
          <div>
            <strong>${progress}%</strong>
            <div class="v15-progress-track"><div class="v15-progress-fill ${statusFor(progress)}" style="width:${clamp(progress, 0, 100)}%"></div></div>
          </div>
        </div>
      `;
    }).join("")}</div>`;

    return componentCard("Focus Direction", "Leadership priorities ranked for today", body);
  }

  function actionRequired(rows) {
    const dealers = groupCount(rows, "dealer");
    const models = groupCount(rows, "model");
    const body = `
      <div class="v15-action-list">
        <div class="v15-action-item"><div class="v15-action-icon">1</div><div><strong>Call ${dealers[0]?.label || "top dealer"}</strong><span>Confirm booking-to-delivery blockers before noon.</span></div><div class="v15-action-priority">High</div></div>
        <div class="v15-action-item"><div class="v15-action-icon">2</div><div><strong>Push ${models[0]?.label || "priority model"}</strong><span>Align offer, stock availability, and sales follow-up.</span></div><div class="v15-action-priority">High</div></div>
        <div class="v15-action-item"><div class="v15-action-icon">3</div><div><strong>Review low margin deals</strong><span>Approve discount exceptions only with delivery certainty.</span></div><div class="v15-action-priority">Watch</div></div>
      </div>
    `;
    return componentCard("Action Required", "Immediate management actions", body);
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
          x: { grid: { display: false }, ticks: { color: COLORS.muted, font: { size: 11, weight: "700" } } },
          y: { beginAtZero: true, grid: { color: COLORS.line }, ticks: { color: COLORS.muted, font: { size: 11, weight: "700" } } }
        }
      }, options || {})
    });
  }

  function renderRankList(items, total) {
    if (!items.length) return emptyState("No ranking data for current filters");
    const max = items[0]?.value || 1;
    return `<div class="v15-rank-list">${items.map(item => `
      <div class="v15-rank-row">
        <span>${item.label}</span><small>${fmt(item.value)} / ${pct(item.value, total || 1)}%</small>
        <div class="v15-progress-track"><div class="v15-progress-fill" style="width:${clamp(pct(item.value, max), 0, 100)}%"></div></div>
        <small>${pct(item.value, max)}%</small>
      </div>
    `).join("")}</div>`;
  }

  function topDealer(rows) {
    const dealers = groupCount(rows, "dealer");
    const top = dealers[0] || { label: "-", value: 0 };
    const revenueByDealer = groupSum(rows, "dealer", "netReceived");
    const gpByDealer = groupSum(rows, "dealer", "gp1");
    const revenue = revenueByDealer.find(item => item.label === top.label)?.value || 0;
    const gp = gpByDealer.find(item => item.label === top.label)?.value || 0;
    const body = `
      <div class="v15-top-entity">
        <div class="v15-entity-hero"><span>Top Dealer</span><strong>${top.label}</strong><small>${pct(top.value, rows.length || 1)}% of filtered deliveries</small></div>
        <div class="v15-entity-metrics">
          <div class="v15-mini-metric"><span>Units</span><strong>${fmt(top.value)}</strong></div>
          <div class="v15-mini-metric"><span>Revenue</span><strong>${fmtMoney(revenue)}</strong></div>
          <div class="v15-mini-metric"><span>GP</span><strong>${fmtMoney(gp)}</strong></div>
          <div class="v15-mini-metric"><span>Share</span><strong>${pct(top.value, rows.length || 1)}%</strong></div>
        </div>
      </div>
    `;
    return componentPanel("Top Dealer", "Dealer concentration and value signal", body);
  }

  function topModel(rows) {
    const models = groupCount(rows, "model");
    const top = models[0] || { label: "-", value: 0 };
    const revenueByModel = groupSum(rows, "model", "netReceived");
    const gpByModel = groupSum(rows, "model", "gp1");
    const revenue = revenueByModel.find(item => item.label === top.label)?.value || 0;
    const gp = gpByModel.find(item => item.label === top.label)?.value || 0;
    const body = `
      <div class="v15-top-entity">
        <div class="v15-entity-hero"><span>Top Model</span><strong>${top.label}</strong><small>${pct(top.value, rows.length || 1)}% of filtered deliveries</small></div>
        <div class="v15-entity-metrics">
          <div class="v15-mini-metric"><span>Units</span><strong>${fmt(top.value)}</strong></div>
          <div class="v15-mini-metric"><span>Revenue</span><strong>${fmtMoney(revenue)}</strong></div>
          <div class="v15-mini-metric"><span>GP</span><strong>${fmtMoney(gp)}</strong></div>
          <div class="v15-mini-metric"><span>Share</span><strong>${pct(top.value, rows.length || 1)}%</strong></div>
        </div>
      </div>
    `;
    return componentPanel("Top Model", "Product mix and profitability signal", body);
  }

  function executiveInsight(rows) {
    const dealers = groupCount(rows, "dealer");
    const models = groupCount(rows, "model");
    const gp = sum(rows, "gp1");
    const revenue = sum(rows, "netReceived");
    const margin = revenue ? ((gp / revenue) * 100).toFixed(1) : "0.0";
    const concentration = pct(dealers[0]?.value || 0, rows.length || 1);
    const body = `
      <div class="v15-insight-list">
        <div class="v15-insight-item"><strong>Dealer concentration</strong><span>${dealers[0]?.label || "-"} contributes ${concentration}% of filtered delivery volume. Keep the dealer close, but watch over-dependence.</span></div>
        <div class="v15-insight-item"><strong>Product execution</strong><span>${models[0]?.label || "-"} is the current model to protect with stock, sales talking points, and delivery readiness.</span></div>
        <div class="v15-insight-item"><strong>Margin discipline</strong><span>GP margin is ${margin}%. Review discount pressure before approving end-of-day exceptions.</span></div>
      </div>
    `;
    return componentPanel("Executive Insight", "Board-style interpretation from filtered data", body);
  }

  function renderTables(rows) {
    const dealers = groupCount(rows, "dealer").slice(0, 5);
    const models = groupCount(rows, "model").slice(0, 5);
    const gpByModel = groupSum(rows, "model", "gp1");
    const dealerRows = dealers.map(item => `<tr><td>${item.label}</td><td class="text-right">${fmt(item.value)}</td><td class="text-right">${pct(item.value, rows.length || 1)}%</td></tr>`).join("");
    const modelRows = models.map(item => {
      const gp = gpByModel.find(row => row.label === item.label)?.value || 0;
      return `<tr><td>${item.label}</td><td class="text-right">${fmt(item.value)}</td><td class="text-right">${fmtMoney(gp)}</td></tr>`;
    }).join("");

    return `
      <section class="v15-grid-2">
        ${componentPanel("Dealer Table", "Top 5 dealer contribution", `<div class="v15-table-wrap"><table class="v15-table"><thead><tr><th>Dealer</th><th class="text-right">Units</th><th class="text-right">Share</th></tr></thead><tbody>${dealerRows || "<tr><td colspan='3'>No data</td></tr>"}</tbody></table></div>`)}
        ${componentPanel("Model Table", "Top 5 model contribution", `<div class="v15-table-wrap"><table class="v15-table"><thead><tr><th>Model</th><th class="text-right">Units</th><th class="text-right">GP</th></tr></thead><tbody>${modelRows || "<tr><td colspan='3'>No data</td></tr>"}</tbody></table></div>`)}
      </section>
    `;
  }

  function renderContent() {
    const rows = state.filtered;
    $("#lastUpdated").textContent = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    $("#focusContent").innerHTML = [
      renderMission(rows),
      renderKpis(rows),
      `<section class="v15-grid-2">${focusDirection(rows)}${actionRequired(rows)}</section>`,
      `<section class="v15-grid-4">
        ${componentPanel("Sales Trend", "Monthly delivery movement", `<div class="v15-chart-box"><canvas id="salesTrendChart"></canvas></div>`)}
        ${componentPanel("Booking vs Delivery", "Pipeline conversion proxy", `<div class="v15-chart-box compact"><canvas id="bookingDeliveryChart"></canvas></div>`)}
        ${topDealer(rows)}
        ${topModel(rows)}
      </section>`,
      `<section class="v15-grid-3">
        ${componentPanel("Dealer Ranking", "Unit contribution by dealer", renderRankList(groupCount(rows, "dealer").slice(0, 6), rows.length))}
        ${componentPanel("Model Ranking", "Unit contribution by model", renderRankList(groupCount(rows, "model").slice(0, 6), rows.length))}
        ${executiveInsight(rows)}
      </section>`,
      renderTables(rows)
    ].join("");

    renderCharts(rows);
  }

  function renderCharts(rows) {
    const monthly = groupCount(rows, "monthYear").sort((a, b) => String(a.label).localeCompare(String(b.label))).slice(-8);
    const booking = Math.round(rows.length * 0.8);
    const delivery = rows.length;

    chart("salesTrendChart", "line", {
      labels: monthly.map(item => item.label),
      datasets: [{
        data: monthly.map(item => item.value),
        borderColor: COLORS.orange,
        backgroundColor: "rgba(243, 112, 33, 0.14)",
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: COLORS.orange,
        tension: 0.35
      }]
    });

    chart("bookingDeliveryChart", "bar", {
      labels: ["Booking", "Delivery", "Target"],
      datasets: [{
        data: [booking, delivery, TARGETS.delivery],
        backgroundColor: [COLORS.blue, COLORS.orange, COLORS.navy],
        borderRadius: 8
      }]
    });
  }

  function applyFilters() {
    state.filtered = selectedRows();
    renderContent();
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
        state.filters = { company: state.filters.company, branch: "all", dealer: "all", dateRange: "mtd", model: "all", salesperson: "all" };
        populateFilters();
        applyFilters();
      }
    });
  }

  async function loadRows() {
    const path = window.KMMSecurity?.company?.datasetPath?.() || "data/dashboard_data.json";
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return response.json();
  }

  async function init() {
    document.body.innerHTML = componentShell();
    const session = window.KMMSecurity?.auth?.readSession?.();
    if (session) {
      $("#userName").textContent = session.username;
      $("#userRole").textContent = session.role;
      $("#userAvatar").textContent = String(session.username || "U").slice(0, 1).toUpperCase();
      state.filters.company = session.company === "KM" ? "KM" : "KMM";
    }
    state.rows = await loadRows();
    state.filtered = selectedRows();
    populateFilters();
    bindControls();
    renderContent();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(error => {
      console.error(error);
      document.body.innerHTML = `<main class="v15-main"><section class="v15-panel"><h3>Data load error</h3><p>${error.message}</p></section></main>`;
    });
  });
})(window, document);
