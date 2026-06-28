(function (window) {
  "use strict";

  const BI = window.BI || {};
  const utils = BI.utils;

  const pages = {
    "executive.html": {
      module: "landing",
      title: "Executive Summary",
      insight: "executive",
      modules: ["Landing Dashboard", "Finance Dashboard", "Dealer KPI"]
    },
    "salesman.html": {
      module: "salesman-kpi",
      title: "Sales Coaching Insight",
      insight: "salesman",
      modules: ["Salesman KPI", "Booking Dashboard"]
    },
    "sales.html": {
      module: "booking",
      title: "KPI Alert Center",
      insight: "alert",
      modules: ["Booking Dashboard", "Finance Dashboard"]
    },
    "product.html": {
      module: "inventory",
      title: "Product Recommendation",
      insight: "product",
      modules: ["Inventory Dashboard", "Finance Dashboard"]
    },
    "dealer.html": {
      module: "dealer-kpi",
      title: "Dealer Health Insight",
      insight: "dealer",
      modules: ["Dealer KPI", "Inventory Dashboard"]
    },
    "forecast.html": {
      module: "forecast",
      title: "Forecast Recommendation",
      insight: "forecast",
      modules: ["Landing Dashboard", "Booking Dashboard", "Salesman KPI"]
    }
  };

  const moduleRegistry = [
    { id: "landing", label: "Landing Dashboard", status: "active" },
    { id: "booking", label: "Booking Dashboard", status: "foundation" },
    { id: "inventory", label: "Inventory Dashboard", status: "foundation" },
    { id: "finance", label: "Finance Dashboard", status: "foundation" },
    { id: "dealer-kpi", label: "Dealer KPI", status: "active" },
    { id: "salesman-kpi", label: "Salesman KPI", status: "active" }
  ];

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

  function pageRows(rows) {
    if (Array.isArray(rows)) return rows;
    if (BI.filters && BI.filters.applyFilters) return BI.filters.applyFilters(utils.getCoreProductData());
    return utils.getCoreProductData();
  }

  function topName(rows, getter) {
    const grouped = utils.groupBy(rows, getter);
    return grouped[0] || { name: "-", units: 0, gpPct: 0, share: 0, sales: 0 };
  }

  function byMonth(rows) {
    return utils.groupBy(rows, (item) => utils.monthName(item.month));
  }

  function insightFor(type, rows) {
    if (!rows.length) {
      return {
        headline: "No filtered records",
        detail: "Adjust filters to show rule-based insight from dashboard data.",
        action: "No external AI API is connected."
      };
    }

    const kpi = utils.kpi(rows);
    const dealer = topName(rows, (item) => item.dealer);
    const salesman = topName(rows, utils.salesmanName);
    const product = topName(rows, (item) => item.model);
    const productType = topName(rows, (item) => item.type);
    const weakestDealer = utils.groupBy(rows, (item) => item.dealer).at(-1) || dealer;
    const monthly = byMonth(rows).sort((a, b) => b.units - a.units);
    const forecast = Math.round(kpi.units * 1.08);

    const library = {
      executive: {
        headline: `${kpi.units.toLocaleString()} units with ${utils.formatPercent(kpi.gpPct)} GP`,
        detail: `${dealer.name} leads dealer contribution at ${utils.formatPercent(dealer.share)}.`,
        action: kpi.gpPct < 8 ? "Protect margin before pushing additional volume." : "Maintain weekly close rhythm on top models."
      },
      salesman: {
        headline: `${salesman.name} is the current top performer`,
        detail: `${salesman.units.toLocaleString()} units and ${utils.formatPercent(salesman.gpPct)} GP margin.`,
        action: kpi.gpPct < 9 ? "Coach discount discipline and prioritize high-GP opportunities." : "Share winning activity pattern with lower-volume reps."
      },
      product: {
        headline: `${product.name} is the leading model`,
        detail: `${productType.name} contributes ${utils.formatPercent(productType.share)} of filtered units.`,
        action: productType.share > 65 ? "Watch concentration risk and keep backup models active." : "Use top model demand to open adjacent product conversations."
      },
      dealer: {
        headline: `${dealer.name} is healthiest by unit volume`,
        detail: `${weakestDealer.name} has the lowest filtered contribution.`,
        action: dealer.share > 60 ? "Reduce dependency by lifting secondary dealer activity." : "Keep dealer scorecards under weekly review."
      },
      forecast: {
        headline: `${forecast.toLocaleString()} unit rule-based forecast`,
        detail: `${monthly[0]?.name || "-"} is the strongest month in the filtered data.`,
        action: forecast < 400 ? "Close the target gap through priority dealer and salesman follow-up." : "Forecast is above baseline target; protect margin quality."
      },
      alert: {
        headline: kpi.gpPct < 8 ? "Margin alert requires attention" : "KPI alert center is stable",
        detail: `${dealer.name} leads sales; ${product.name} leads model contribution.`,
        action: rows.length < 10 ? "Filtered sample is small. Broaden filters before making decisions." : "No critical rule-based alert for the current filter."
      }
    };

    return library[type] || library.executive;
  }

  function ensureEnterprisePanel() {
    let panel = document.getElementById("enterpriseFoundation");
    if (panel) return panel;

    const config = pageConfig();
    panel = el("section", "enterprise-foundation");
    panel.id = "enterpriseFoundation";
    panel.setAttribute("aria-label", "v5 Enterprise Foundation");
    panel.innerHTML = `
      <div class="enterprise-block insight-card">
        <div class="enterprise-eyebrow">AI Intelligence Foundation</div>
        <h2 id="enterpriseInsightTitle">${config.title}</h2>
        <strong id="enterpriseInsightHeadline">Loading insight...</strong>
        <p id="enterpriseInsightDetail">Rule-based analysis will appear after dashboard data loads.</p>
        <small id="enterpriseInsightAction">No external AI API is connected.</small>
      </div>
      <div class="enterprise-block">
        <div class="enterprise-eyebrow">Dashboard Framework</div>
        <h2>Module Readiness</h2>
        <div id="enterpriseModuleList" class="module-pills"></div>
      </div>
      <div class="enterprise-block export-card">
        <div class="enterprise-eyebrow">Export Foundation</div>
        <h2>Export</h2>
        <div class="export-actions" id="enterpriseExportActions"></div>
        <p id="enterpriseExportStatus" class="export-status">Export handlers are safe placeholders for v5.</p>
      </div>`;

    const anchor = document.querySelector(".ai-strip");
    if (anchor) {
      anchor.insertAdjacentElement("afterend", panel);
    } else {
      document.querySelector(".main-content")?.appendChild(panel);
    }
    return panel;
  }

  function renderModules(config) {
    const target = document.getElementById("enterpriseModuleList");
    if (!target) return;
    target.innerHTML = moduleRegistry.map((module) => {
      const active = config.modules.includes(module.label);
      const state = active ? "active" : module.status;
      return `<span class="module-pill ${active ? "is-active" : ""}">${module.label}<small>${state}</small></span>`;
    }).join("");
  }

  function handleExport(kind) {
    const status = document.getElementById("enterpriseExportStatus");
    if (status) {
      status.textContent = `${kind} export placeholder is ready. Full file generation will be added without external services in a later phase.`;
    }
  }

  function renderExports() {
    const target = document.getElementById("enterpriseExportActions");
    if (!target || target.dataset.ready === "true") return;
    ["PDF", "PowerPoint", "Excel", "PNG"].forEach((kind) => {
      const button = el("button", "export-button", kind);
      button.type = "button";
      button.addEventListener("click", () => handleExport(kind));
      target.appendChild(button);
    });
    target.dataset.ready = "true";
  }

  function renderInsight(rows) {
    const config = pageConfig();
    const insight = insightFor(config.insight, pageRows(rows));
    utils.setText("enterpriseInsightTitle", config.title);
    utils.setText("enterpriseInsightHeadline", insight.headline);
    utils.setText("enterpriseInsightDetail", insight.detail);
    utils.setText("enterpriseInsightAction", insight.action);
  }

  function ensureFooter() {
    if (document.getElementById("enterpriseFooter")) return;
    const footer = el("footer", "enterprise-footer");
    footer.id = "enterpriseFooter";
    footer.innerHTML = "<strong>KMM Sales Intelligence v5 Enterprise Foundation</strong><span>Static GitHub Pages dashboard | Local data only | Export and AI APIs are placeholders</span>";
    document.querySelector(".main-content")?.appendChild(footer);
  }

  function init() {
    const config = pageConfig();
    document.documentElement.dataset.dashboardModule = config.module;
    ensureEnterprisePanel();
    renderModules(config);
    renderExports();
    ensureFooter();
    renderInsight();
  }

  function refresh(rows) {
    ensureEnterprisePanel();
    renderInsight(rows);
  }

  BI.enterprise = {
    pages,
    moduleRegistry,
    components: { el },
    init,
    refresh,
    insightFor,
    handleExport
  };

  document.addEventListener("DOMContentLoaded", init);
  window.BI = BI;
})(window);
