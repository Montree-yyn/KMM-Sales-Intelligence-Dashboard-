(function (window) {
  "use strict";

  const BI = window.BI || {};
  const utils = BI.utils;

  const pages = {
    "executive.html": {
      module: "executive",
      eyebrow: "Executive BI Command Center",
      title: "Executive Overview",
      subtitle: "Company-wide revenue, unit sales, margin quality, and leadership priorities in one enterprise view.",
      insight: "executive",
      icon: "⌂",
      modules: ["Executive", "Sales", "Product", "Dealer"]
    },
    "salesman.html": {
      module: "salesman",
      eyebrow: "Performance Coaching",
      title: "Sales Performance",
      subtitle: "Salesman productivity, achievement ranking, activity quality, and coaching opportunities.",
      insight: "salesman",
      icon: "◉",
      modules: ["Salesman", "Coaching", "Achievement", "Activity"]
    },
    "sales.html": {
      module: "sales",
      eyebrow: "Commercial Analytics",
      title: "Sales Analytics",
      subtitle: "Period performance, channel mix, payment behavior, and product contribution trends.",
      insight: "sales",
      icon: "↗",
      modules: ["Sales", "Channel", "Payment", "Trend"]
    },
    "product.html": {
      module: "product",
      eyebrow: "Product Intelligence",
      title: "Product Intelligence",
      subtitle: "Model demand, product mix, GP quality, inventory signals, and cross-dealer movement.",
      insight: "product",
      icon: "▣",
      modules: ["Product", "Inventory", "Margin", "Heatmap"]
    },
    "dealer.html": {
      module: "dealer",
      eyebrow: "Dealer Network Health",
      title: "Dealer Intelligence",
      subtitle: "Dealer contribution, health signals, pipeline conversion, stock age, and coverage priorities.",
      insight: "dealer",
      icon: "◆",
      modules: ["Dealer", "Health", "Collection", "Coverage"]
    },
    "forecast.html": {
      module: "forecast",
      eyebrow: "Forecast AI Foundation",
      title: "Sales Forecast AI",
      subtitle: "Rule-based forecast, target gap, pipeline probability, and next-action guidance.",
      insight: "forecast",
      icon: "◎",
      modules: ["Forecast", "Pipeline", "Target", "Scenario"]
    }
  };

  const kpiIcons = ["◒", "◈", "◐", "%", "◇", "↔"];
  const exportKinds = ["PDF", "PPT", "Excel", "PNG"];

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function currentPage() {
    return location.pathname.split("/").pop() || "executive.html";
  }

  function pageConfig() {
    return pages[currentPage()] || pages["executive.html"];
  }

  function rowsForInsight(rows) {
    if (Array.isArray(rows)) return rows;
    if (BI.filters && BI.filters.applyFilters) return BI.filters.applyFilters(utils.getCoreProductData());
    return utils.getCoreProductData();
  }

  function groupedTop(rows, getter) {
    const grouped = utils.groupBy(rows, getter);
    return grouped[0] || { name: "-", units: 0, gpPct: 0, share: 0, sales: 0, value: 0 };
  }

  function groupedBottom(rows, getter) {
    const grouped = utils.groupBy(rows, getter);
    return grouped.at(-1) || { name: "-", units: 0, gpPct: 0, share: 0, sales: 0, value: 0 };
  }

  function emptyInsight(title) {
    return {
      title,
      severity: "Waiting",
      headline: "No data for current filters",
      detail: "Adjust filters to generate this rule-based insight from dashboard_data.json.",
      action: "Safe placeholder. No external AI API is used."
    };
  }

  function insightSet(rows) {
    if (!rows.length) {
      return [
        emptyInsight("Sales Performance"),
        emptyInsight("Dealer Performance"),
        emptyInsight("Product Performance"),
        emptyInsight("Forecast Risk"),
        emptyInsight("Low GP Warning"),
        emptyInsight("Top Performer")
      ];
    }

    const kpi = utils.kpi(rows);
    const dealer = groupedTop(rows, (item) => item.dealer);
    const weakDealer = groupedBottom(rows, (item) => item.dealer);
    const product = groupedTop(rows, (item) => item.model);
    const productType = groupedTop(rows, (item) => item.type);
    const lowMarginProduct = utils.groupBy(rows, (item) => item.model).sort((a, b) => a.gpPct - b.gpPct)[0] || product;
    const salesman = groupedTop(rows, utils.salesmanName);
    const monthly = utils.groupBy(rows, (item) => utils.monthName(item.month)).sort((a, b) => b.units - a.units);
    const forecast = Math.round(kpi.units * 1.08);
    const target = Math.max(400, Math.round(kpi.units * 1.12));
    const gap = forecast - target;
    const lowGp = kpi.gpPct < 8;

    return [
      {
        title: "Sales Performance",
        severity: kpi.units >= 400 ? "Strong" : "Review",
        headline: `${kpi.units.toLocaleString()} units sold`,
        detail: `${monthly[0]?.name || "-"} is the strongest month with ${utils.formatMoney(kpi.sales)} total sales value.`,
        action: kpi.units >= 400 ? "Maintain close rhythm and protect margin quality." : "Use dealer and salesman follow-up to close the volume gap."
      },
      {
        title: "Dealer Performance",
        severity: dealer.share > 45 ? "Dependency" : "Balanced",
        headline: `${dealer.name} leads dealer contribution`,
        detail: `${dealer.units.toLocaleString()} units and ${utils.formatPercent(dealer.share)} share. Lowest filtered contribution: ${weakDealer.name}.`,
        action: dealer.share > 45 ? "Lift secondary dealer activity to reduce dependency risk." : "Keep weekly dealer scorecards active."
      },
      {
        title: "Product Performance",
        severity: productType.share > 60 ? "Concentrated" : "Healthy",
        headline: `${product.name} is the top model`,
        detail: `${productType.name} contributes ${utils.formatPercent(productType.share)} of filtered units.`,
        action: productType.share > 60 ? "Prepare substitute model offers and watch concentration risk." : "Use top-model demand to open adjacent product conversations."
      },
      {
        title: "Forecast Risk",
        severity: gap < 0 ? "Gap" : "On Track",
        headline: `${forecast.toLocaleString()} unit rule-based forecast`,
        detail: `Static target placeholder is ${target.toLocaleString()} units, leaving ${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units gap.`,
        action: gap < 0 ? "Prioritize high-probability deals and top dealer follow-up." : "Forecast is above baseline; protect GP while closing."
      },
      {
        title: "Low GP Warning",
        severity: lowGp ? "High" : "Stable",
        headline: `${utils.formatPercent(kpi.gpPct)} GP margin`,
        detail: `${lowMarginProduct.name} is the lowest-margin model at ${utils.formatPercent(lowMarginProduct.gpPct)}.`,
        action: lowGp ? "Review discounts, campaigns, and cost leakage before adding volume pressure." : "Margin is stable. Keep price discipline visible."
      },
      {
        title: "Top Performer",
        severity: "Leader",
        headline: `${salesman.name} leads filtered performance`,
        detail: `${salesman.units.toLocaleString()} units, ${utils.formatPercent(salesman.share)} share, and ${utils.formatPercent(salesman.gpPct)} GP margin.`,
        action: "Turn top performer behavior into a coaching reference for the team."
      }
    ];
  }

  function insightFor(type, rows) {
    if (!rows.length) {
      return {
        headline: "No records match the current filters",
        detail: "The V5 insight engine is ready. Adjust filters to generate rule-based guidance from local dashboard data.",
        action: "No external AI API is used.",
        risk: "Waiting for data"
      };
    }

    const kpi = utils.kpi(rows);
    const dealer = groupedTop(rows, (item) => item.dealer);
    const salesman = groupedTop(rows, utils.salesmanName);
    const product = groupedTop(rows, (item) => item.model);
    const typeMix = groupedTop(rows, (item) => item.type);
    const monthly = utils.groupBy(rows, (item) => utils.monthName(item.month)).sort((a, b) => b.units - a.units);
    const weakestDealer = utils.groupBy(rows, (item) => item.dealer).at(-1) || dealer;
    const forecast = Math.round(kpi.units * 1.08);
    const marginSignal = kpi.gpPct < 8 ? "Margin pressure" : kpi.gpPct < 12 ? "Balanced margin" : "Premium margin";

    const library = {
      executive: {
        headline: `${kpi.units.toLocaleString()} units with ${utils.formatPercent(kpi.gpPct)} GP margin`,
        detail: `${dealer.name} leads dealer contribution at ${utils.formatPercent(dealer.share)} share, while ${product.name} is the strongest model.`,
        action: kpi.gpPct < 8 ? "Prioritize margin protection before chasing extra volume." : "Maintain executive focus on top model availability and weekly close rhythm.",
        risk: marginSignal
      },
      salesman: {
        headline: `${salesman.name} leads the filtered sales team`,
        detail: `${salesman.units.toLocaleString()} units, ${utils.formatPercent(salesman.share)} share, and ${utils.formatPercent(salesman.gpPct)} GP margin.`,
        action: kpi.gpPct < 9 ? "Coach discount control and route high-GP leads to stronger closers." : "Turn the top performer's activity pattern into a coaching playbook.",
        risk: marginSignal
      },
      sales: {
        headline: `${monthly[0]?.name || "-"} is the strongest sales month`,
        detail: `${dealer.name} leads dealer volume and ${typeMix.name} contributes ${utils.formatPercent(typeMix.share)} of units.`,
        action: rows.length < 10 ? "Filtered sample is small; broaden filters before deciding." : "Use channel and payment mix to tune this month's closing plan.",
        risk: marginSignal
      },
      product: {
        headline: `${product.name} is the leading product signal`,
        detail: `${typeMix.name} represents ${utils.formatPercent(typeMix.share)} of filtered units with ${utils.formatPercent(typeMix.gpPct)} GP margin.`,
        action: typeMix.share > 65 ? "Watch concentration risk and keep substitute models active." : "Use top model demand to open adjacent product conversations.",
        risk: typeMix.share > 65 ? "Concentration risk" : "Healthy mix"
      },
      dealer: {
        headline: `${dealer.name} is strongest by current unit volume`,
        detail: `${weakestDealer.name} has the lowest filtered contribution and should be reviewed for activity or stock constraints.`,
        action: dealer.share > 60 ? "Reduce dependency by lifting secondary dealer activity." : "Keep dealer scorecards under weekly review.",
        risk: dealer.share > 60 ? "Dealer dependency" : "Balanced network"
      },
      forecast: {
        headline: `${forecast.toLocaleString()} unit rule-based forecast`,
        detail: `${monthly[0]?.name || "-"} is the strongest historical month in the current filter set.`,
        action: forecast < 400 ? "Close the target gap through priority dealer and salesman follow-up." : "Forecast is above baseline target; protect margin quality.",
        risk: forecast < 400 ? "Target gap" : "On track"
      }
    };

    return library[type] || library.executive;
  }

  function ensureHeader() {
    const config = pageConfig();
    const header = document.querySelector(".page-head, .topbar");
    if (!header || header.dataset.enterpriseReady === "true") return;

    header.classList.add("enterprise-header");
    header.dataset.enterpriseReady = "true";
    header.innerHTML = `
      <div class="enterprise-title-block">
        <div class="enterprise-eyebrow">${config.eyebrow}</div>
        <h1>${config.title}</h1>
        <p>${config.subtitle}</p>
        <div class="enterprise-refresh">Last refresh <strong id="enterpriseLastRefresh">Loading...</strong></div>
      </div>
      <div class="enterprise-actions" aria-label="Dashboard actions">
        <button type="button" class="enterprise-action primary" data-enterprise-action="ai">AI Summary</button>
        <button type="button" class="enterprise-action" data-enterprise-action="refresh">Refresh View</button>
        <button type="button" class="enterprise-action" data-enterprise-export="PDF">Export PDF</button>
        <button type="button" class="enterprise-action" data-enterprise-export="PPT">Export PPT</button>
        <button type="button" class="enterprise-action" data-enterprise-export="Excel">Export Excel</button>
        <button type="button" class="enterprise-action" data-enterprise-export="PNG">Export PNG</button>
      </div>`;
  }

  function ensureInsightPanel() {
    let panel = document.getElementById("enterpriseInsightPanel");
    if (panel) return panel;

    const config = pageConfig();
    panel = el("section", "enterprise-insight-panel");
    panel.id = "enterpriseInsightPanel";
    panel.setAttribute("aria-label", "Executive summary and AI insight");
    panel.innerHTML = `
      <div class="insight-orb">${config.icon}</div>
      <div class="insight-copy">
        <div class="enterprise-eyebrow">Executive Summary / AI Insight</div>
        <h2 id="enterpriseInsightHeadline">Loading insight...</h2>
        <p id="enterpriseInsightDetail">Rule-based analysis will appear after dashboard data loads.</p>
      </div>
      <div class="insight-action-card">
        <span id="enterpriseInsightRisk">Local data only</span>
        <strong id="enterpriseInsightAction">No external AI API is connected.</strong>
      </div>`;

    const header = document.querySelector(".enterprise-header");
    if (header) header.insertAdjacentElement("afterend", panel);
    return panel;
  }

  function ensureFoundationPanel() {
    let panel = document.getElementById("enterpriseFoundation");
    if (panel) return panel;

    panel = el("section", "enterprise-foundation");
    panel.id = "enterpriseFoundation";
    panel.innerHTML = `
      <div class="enterprise-block">
        <div class="enterprise-eyebrow">Dashboard Modules</div>
        <h2>V5 Enterprise Coverage</h2>
        <div id="enterpriseModuleList" class="module-pills"></div>
      </div>
      <div class="enterprise-block export-card">
        <div class="enterprise-eyebrow">Export Foundation</div>
        <h2>Prepared Outputs</h2>
        <div class="export-actions" id="enterpriseExportActions"></div>
        <p id="enterpriseExportStatus" class="export-status">Prepared for V5.2 Export Center.</p>
      </div>`;

    const anchor = document.querySelector(".ai-strip");
    if (anchor) anchor.insertAdjacentElement("afterend", panel);
    else document.querySelector(".main-content")?.appendChild(panel);
    return panel;
  }

  function ensureInsightEnginePanel() {
    let panel = document.getElementById("enterpriseInsightEngine");
    if (panel) return panel;

    panel = el("section", "enterprise-ai-engine");
    panel.id = "enterpriseInsightEngine";
    panel.innerHTML = `
      <div class="enterprise-ai-heading">
        <div>
          <div class="enterprise-eyebrow">AI Insight Engine</div>
          <h2>V5.1 Rule-Based Insights</h2>
        </div>
        <span>Local dashboard_data.json only</span>
      </div>
      <div id="enterpriseInsightGrid" class="enterprise-insight-grid"></div>`;

    const anchor = document.getElementById("enterpriseFoundation");
    if (anchor) anchor.insertAdjacentElement("beforebegin", panel);
    else document.querySelector(".main-content")?.appendChild(panel);
    return panel;
  }

  function renderModules() {
    const config = pageConfig();
    const target = document.getElementById("enterpriseModuleList");
    if (!target) return;
    target.innerHTML = config.modules.map((module) => `<span class="module-pill is-active">${module}<small>ready</small></span>`).join("");
  }

  function toast(message) {
    let node = document.getElementById("enterpriseToast");
    if (!node) {
      node = el("div", "enterprise-toast");
      node.id = "enterpriseToast";
      node.setAttribute("role", "status");
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => node.classList.remove("show"), 2600);
  }

  function handleExport(kind) {
    const message = "Prepared for V5.2 Export Center";
    const status = document.getElementById("enterpriseExportStatus");
    if (status) status.textContent = `${kind} placeholder: ${message}.`;
    toast(message);
  }

  function renderAiInsight(targetId, insight) {
    const target = document.getElementById(targetId);
    if (!target || !insight) return;
    target.innerHTML = `
      <div class="ai-insight-card">
        <span>${insight.risk || "Local insight"}</span>
        <strong>${insight.headline || "Insight ready"}</strong>
        <p>${insight.detail || "Rule-based V5 insight is prepared from local dashboard data."}</p>
        <small>${insight.action || "No external AI API is connected."}</small>
      </div>`;
  }

  function premiumCard(label, value, meta = "") {
    return `
      <div class="premium-stat-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${meta}</small>
      </div>`;
  }

  function themeClass(name, enabled = true) {
    document.documentElement.classList.toggle(`enterprise-${name}`, enabled);
  }

  function renderExports() {
    const target = document.getElementById("enterpriseExportActions");
    if (!target || target.dataset.ready === "true") return;
    exportKinds.forEach((kind) => {
      const button = el("button", "export-button", `${kind} placeholder`);
      button.type = "button";
      button.dataset.enterpriseExport = kind;
      target.appendChild(button);
    });
    target.dataset.ready = "true";
  }

  function renderInsightEngine(rows) {
    const target = document.getElementById("enterpriseInsightGrid");
    if (!target) return;
    target.innerHTML = insightSet(rows).map((insight) => `
      <article class="enterprise-ai-card">
        <span>${insight.title}</span>
        <strong>${insight.headline}</strong>
        <p>${insight.detail}</p>
        <small><b>${insight.severity}</b> ${insight.action}</small>
      </article>`).join("");
  }

  function bindActions() {
    if (document.body.dataset.enterpriseActionsReady === "true") return;
    document.body.dataset.enterpriseActionsReady = "true";
    document.addEventListener("click", (event) => {
      const exportButton = event.target.closest("[data-enterprise-export]");
      if (exportButton) {
        handleExport(exportButton.dataset.enterpriseExport);
        return;
      }
      const action = event.target.closest("[data-enterprise-action]")?.dataset.enterpriseAction;
      if (action === "ai") {
        toast("AI Summary uses local rule-based insight in V5. External AI is prepared for a later phase.");
      }
      if (action === "refresh") {
        BI.enterprise.refresh();
        toast("Dashboard view refreshed from current filters.");
      }
    });
  }

  function enhanceKpis() {
    document.querySelectorAll(".kpi-grid .kpi-card").forEach((card, index) => {
      if (card.dataset.enterpriseReady === "true") return;
      const label = card.querySelector("span")?.textContent || "KPI";
      const mini = card.querySelector("small")?.textContent || "Current filter";
      card.dataset.enterpriseReady = "true";
      card.insertAdjacentHTML("afterbegin", `<div class="kpi-icon" aria-hidden="true">${kpiIcons[index % kpiIcons.length]}</div><div class="kpi-mini">Live KPI</div>`);
      let delta = card.querySelector(".kpi-delta");
      if (!delta) {
        delta = el("em", "kpi-delta", mini);
        card.appendChild(delta);
      }
      card.setAttribute("aria-label", label);
    });
  }

  function enhancePanels() {
    document.querySelectorAll(".panel").forEach((panel) => {
      if (panel.dataset.enterpriseReady === "true") return;
      panel.dataset.enterpriseReady = "true";
      const heading = panel.querySelector("h2");
      if (heading) {
        const wrap = el("div", "panel-title-row");
        heading.parentNode.insertBefore(wrap, heading);
        wrap.appendChild(heading);
        wrap.insertAdjacentHTML("beforeend", '<span class="panel-status">Live</span>');
      }
      const note = panel.querySelector("p");
      if (note) note.classList.add("panel-note");
    });
  }

  function updateEmptyStates(rows) {
    document.querySelectorAll(".panel").forEach((panel) => {
      let empty = panel.querySelector(".enterprise-empty-state");
      if (!rows.length) {
        panel.classList.add("is-empty");
        if (!empty) {
          empty = el("div", "enterprise-empty-state", "No data for the current filter selection.");
          panel.appendChild(empty);
        }
      } else {
        panel.classList.remove("is-empty");
        empty?.remove();
      }
    });
  }

  function refresh(rows) {
    const data = rowsForInsight(rows);
    const config = pageConfig();
    const insight = insightFor(config.insight, data);
    ensureHeader();
    ensureInsightPanel();
    ensureFoundationPanel();
    ensureInsightEnginePanel();
    enhanceKpis();
    enhancePanels();
    updateEmptyStates(data);
    renderInsightEngine(data);
    utils.setText("enterpriseLastRefresh", utils.lastRefresh());
    utils.setText("enterpriseInsightHeadline", insight.headline);
    utils.setText("enterpriseInsightDetail", insight.detail);
    utils.setText("enterpriseInsightAction", insight.action);
    utils.setText("enterpriseInsightRisk", insight.risk);
  }

  function ensureFooter() {
    if (document.getElementById("enterpriseFooter")) return;
    const footer = el("footer", "enterprise-footer");
    footer.id = "enterpriseFooter";
    footer.innerHTML = "<strong>KMM Sales Intelligence V5 Enterprise BI</strong><span>Static GitHub Pages dashboard | Local data only | AI and export actions are safe placeholders</span>";
    document.querySelector(".main-content")?.appendChild(footer);
  }

  function init() {
    document.documentElement.dataset.dashboardModule = pageConfig().module;
    ensureHeader();
    ensureInsightPanel();
    ensureFoundationPanel();
    ensureInsightEnginePanel();
    renderModules();
    renderExports();
    bindActions();
    enhanceKpis();
    enhancePanels();
    ensureFooter();
    refresh();
  }

  BI.enterprise = {
    pages,
    init,
    refresh,
    insightFor,
    handleExport,
    renderAiInsight,
    premiumCard,
    themeClass,
    toast
  };

  document.addEventListener("DOMContentLoaded", init);
  window.BI = BI;
})(window);
