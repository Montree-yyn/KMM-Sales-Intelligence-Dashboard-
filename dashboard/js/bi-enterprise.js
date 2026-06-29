(function (window) {
  "use strict";

  const BI = window.BI || {};
  const utils = BI.utils;

  const pages = {
    "executive.html": {
      module: "executive",
      eyebrow: "V7.1 Production Ready Executive Cockpit",
      title: "Executive Intelligence Cockpit",
      subtitle: "Company-wide revenue, unit sales, margin quality, dealer concentration, production reports, practical exports, and forecast action in one leadership view.",
      insight: "executive",
      icon: "⌂",
      modules: ["Executive", "Sales", "Product", "Dealer"]
    },
    "salesman.html": {
      module: "salesman",
      eyebrow: "V5.2 Performance Coaching",
      title: "Sales Performance",
      subtitle: "Salesman productivity, achievement ranking, activity quality, and coaching opportunities.",
      insight: "salesman",
      icon: "◉",
      modules: ["Salesman", "Coaching", "Achievement", "Activity"]
    },
    "sales.html": {
      module: "sales",
      eyebrow: "V5.2 Commercial Analytics",
      title: "Sales Analytics",
      subtitle: "Period performance, channel mix, payment behavior, and product contribution trends.",
      insight: "sales",
      icon: "↗",
      modules: ["Sales", "Channel", "Payment", "Trend"]
    },
    "product.html": {
      module: "product",
      eyebrow: "V5.2 Product Intelligence",
      title: "Product Intelligence",
      subtitle: "Model demand, product mix, GP quality, inventory signals, and cross-dealer movement.",
      insight: "product",
      icon: "▣",
      modules: ["Product", "Inventory", "Margin", "Heatmap"]
    },
    "dealer.html": {
      module: "dealer",
      eyebrow: "V5.2 Dealer Network Health",
      title: "Dealer Intelligence",
      subtitle: "Dealer contribution, health signals, pipeline conversion, stock age, and coverage priorities.",
      insight: "dealer",
      icon: "◆",
      modules: ["Dealer", "Health", "Collection", "Coverage"]
    },
    "forecast.html": {
      module: "forecast",
      eyebrow: "V5.2 Forecast AI Foundation",
      title: "Sales Forecast AI",
      subtitle: "Rule-based forecast, target gap, pipeline probability, and next-action guidance.",
      insight: "forecast",
      icon: "◎",
      modules: ["Forecast", "Pipeline", "Target", "Scenario"]
    }
  };

  const kpiIcons = ["◒", "◈", "◐", "%", "◇", "↔"];
  const exportKinds = ["PDF", "PowerPoint", "Excel", "PNG"];
  const exportLabels = {
    PDF: "Export PDF",
    PowerPoint: "Export PowerPoint",
    Excel: "Export CSV",
    PNG: "Export PNG"
  };
  let latestRows = [];

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

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
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

  function executiveSummary(rows) {
    if (!rows.length) {
      return {
        overall: "No records match the current filters. Executive summary will update when data is available.",
        leadingDealer: "Dealer leadership cannot be calculated for the current filter.",
        leadingProduct: "Product leadership cannot be calculated for the current filter.",
        margin: "GP margin signal is unavailable because the filtered sales value is zero.",
        forecastRisk: "Forecast risk is pending until filtered records are available.",
        nextAction: "Broaden or reset filters before making an executive decision.",
        forecast: 0,
        target: 0,
        gap: 0
      };
    }

    const kpi = utils.kpi(rows);
    const dealer = groupedTop(rows, (item) => item.dealer);
    const product = groupedTop(rows, (item) => item.model);
    const lowMarginProduct = utils.groupBy(rows, (item) => item.model).sort((a, b) => a.gpPct - b.gpPct)[0] || product;
    const forecast = Math.round(kpi.units * 1.08);
    const target = Math.max(400, Math.round(kpi.units * 1.12));
    const gap = forecast - target;
    const marginSignal = kpi.gpPct < 8 ? "margin pressure" : kpi.gpPct < 11 ? "margin watch" : "stable margin";
    const riskSignal = gap < 0 ? "forecast shortfall" : "forecast on track";
    const nextAction = kpi.gpPct < 8
      ? `Protect margin before adding volume pressure, starting with ${lowMarginProduct.name}.`
      : gap < 0
        ? `Close the ${Math.abs(gap).toLocaleString()} unit forecast gap through high-probability dealer follow-up.`
        : `Maintain weekly close rhythm and secure availability for ${product.name}.`;

    return {
      overall: `${kpi.units.toLocaleString()} units delivered with ${utils.formatMoney(kpi.sales)} sales value in the current filter.`,
      leadingDealer: `${dealer.name} is the leading dealer with ${dealer.units.toLocaleString()} units and ${utils.formatPercent(dealer.share)} share.`,
      leadingProduct: `${product.name} is the leading product with ${product.units.toLocaleString()} units and ${utils.formatPercent(product.share)} share.`,
      margin: `${utils.formatPercent(kpi.gpPct)} GP margin indicates ${marginSignal}. Lowest model pressure: ${lowMarginProduct.name} at ${utils.formatPercent(lowMarginProduct.gpPct)}.`,
      forecastRisk: `${forecast.toLocaleString()} unit rule-based forecast versus ${target.toLocaleString()} baseline target shows ${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units: ${riskSignal}.`,
      nextAction,
      forecast,
      target,
      gap
    };
  }

  function reportLines(kind, rows) {
    const summary = executiveSummary(rows);
    const titleMap = {
      weekly: "Weekly Sales Intelligence Report",
      monthly: "Monthly Sales Intelligence Report",
      executive: "Executive Summary",
      dealer: "Dealer Review"
    };
    const title = titleMap[kind] || titleMap.executive;
    const kpi = utils.kpi(rows);
    const dealers = utils.groupBy(rows, (item) => item.dealer);
    const products = utils.groupBy(rows, (item) => item.model);
    const salesmen = utils.groupBy(rows, utils.salesmanName);
    const topDealer = safeTop(dealers);
    const weakDealer = safeBottom(dealers);
    const topProduct = safeTop(products);
    const topSalesman = safeTop(salesmen);

    if (!rows.length) {
      return {
        title,
        meta: "Current filter has no matching rows.",
        lines: [
          summary.overall,
          summary.leadingDealer,
          summary.leadingProduct,
          summary.margin,
          summary.forecastRisk,
          summary.nextAction
        ]
      };
    }

    const reportSpecific = {
      weekly: [
        `Weekly focus: ${topDealer.name} and ${topProduct.name} should anchor the next close rhythm.`,
        `Sales execution: ${topSalesman.name} is the leading salesman signal in the active data.`,
        `Risk watch: ${summary.gap < 0 ? "recover forecast gap" : "protect margin while ahead of baseline"}.`
      ],
      monthly: [
        `Monthly result: ${kpi.units.toLocaleString()} filtered units and ${utils.formatMoney(kpi.gp)} GP.`,
        `Portfolio signal: ${topProduct.name} leads product contribution; review substitute offers where concentration rises.`,
        "Management rhythm: review dealer, salesman, and margin scorecards before month-end close."
      ],
      executive: [
        summary.overall,
        summary.leadingDealer,
        summary.leadingProduct,
        summary.margin,
        summary.forecastRisk,
        `Recommended next action: ${summary.nextAction}`
      ],
      dealer: [
        `Dealer leader: ${topDealer.name} with ${topDealer.units.toLocaleString()} units and ${utils.formatPercent(topDealer.gpPct)} GP margin.`,
        `Dealer to review: ${weakDealer.name} has the lowest filtered contribution.`,
        `Network balance: top dealer share is ${utils.formatPercent(topDealer.share)}.`,
        `Recommended next action: lift activity, stock visibility, and weekly follow-up for ${weakDealer.name}.`
      ]
    };

    return {
      title,
      meta: `Generated from ${rows.length.toLocaleString()} filtered local records. Last refresh ${utils.lastRefresh()}.`,
      lines: reportSpecific[kind] || reportSpecific.executive
    };
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
        ${config.module === "executive" ? '<button type="button" class="enterprise-action" data-enterprise-action="presentation">Presentation Mode</button>' : ""}
        <button type="button" class="enterprise-action" data-enterprise-action="refresh">Refresh View</button>
        <button type="button" class="enterprise-action" data-enterprise-export="PDF">Export PDF</button>
        <button type="button" class="enterprise-action" data-enterprise-export="PowerPoint">Export PowerPoint</button>
        <button type="button" class="enterprise-action" data-enterprise-export="Excel">Export CSV</button>
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
        <p id="enterpriseExportStatus" class="export-status">V7.1 Export Center prepared.</p>
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
          <h2>V6 Rule-Based Insights</h2>
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

  function downloadFile(filename, mime, content) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = el("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function exportCsv(rows) {
    const data = rowsForInsight(rows || latestRows);
    const kpi = utils.kpi(data);
    const summary = executiveSummary(data);
    const table = [
      ["Metric", "Value"],
      ["Filtered units", kpi.units],
      ["Sales value", kpi.sales],
      ["Gross profit", kpi.gp],
      ["GP margin", utils.formatPercent(kpi.gpPct)],
      ["Forecast", summary.forecast],
      ["Target baseline", summary.target],
      ["Forecast gap", summary.gap],
      ["Overall sales result", summary.overall],
      ["Leading dealer", summary.leadingDealer],
      ["Leading product", summary.leadingProduct],
      ["GP margin signal", summary.margin],
      ["Forecast risk", summary.forecastRisk],
      ["Recommended next action", summary.nextAction]
    ];
    downloadFile("kmm-v7-1-executive-summary.csv", "text/csv;charset=utf-8", table.map((row) => row.map(csvCell).join(",")).join("\n"));
  }

  async function exportPng() {
    const target = document.querySelector(".main-content");
    if (!target) throw new Error("Dashboard area is not available.");

    const clone = target.cloneNode(true);
    clone.querySelectorAll("canvas").forEach((canvasClone, index) => {
      const sourceCanvas = target.querySelectorAll("canvas")[index];
      const image = new Image();
      image.alt = "Rendered chart";
      image.src = sourceCanvas?.toDataURL("image/png") || "";
      image.style.width = "100%";
      image.style.height = "100%";
      canvasClone.replaceWith(image);
    });

    const width = Math.min(1600, Math.max(900, target.scrollWidth));
    const height = Math.min(2200, Math.max(900, target.scrollHeight));
    clone.style.width = `${width}px`;
    clone.style.minHeight = `${height}px`;
    clone.style.padding = "24px";
    clone.style.background = "#f6f7fb";

    const styleText = [...document.styleSheets].map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch (error) {
        return "";
      }
    }).join("\n");
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <style>${styleText}</style>
            ${clone.outerHTML}
          </div>
        </foreignObject>
      </svg>`;
    const image = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("PNG export failed."));
          return;
        }
        downloadFile("kmm-v7-1-dashboard.png", "image/png", blob);
        resolve();
      }, "image/png");
    });
  }

  async function handleExport(kind) {
    let message = "Export action completed.";
    const status = document.getElementById("enterpriseExportStatus");
    if (kind === "PDF") message = "PDF export is prepared for V7.2.";
    if (kind === "PowerPoint") message = "PowerPoint export is prepared for V7.2.";
    if (kind === "Excel") {
      exportCsv();
      message = "CSV summary downloaded from the current filtered dashboard data.";
    }
    if (kind === "PNG") {
      try {
        await exportPng();
        message = "PNG export attempted for the current dashboard area.";
      } catch (error) {
        message = "PNG export could not be completed safely in this browser.";
      }
    }
    if (status) status.textContent = message;
    toast(message);
  }

  function showReport(kind) {
    const report = reportLines(kind, rowsForInsight(latestRows));
    let modal = document.getElementById("enterpriseReportModal");
    if (!modal) {
      modal = el("div", "enterprise-modal-backdrop");
      modal.id = "enterpriseReportModal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.innerHTML = `
        <section class="enterprise-modal-panel">
          <button type="button" class="enterprise-modal-close" data-enterprise-modal-close aria-label="Close report">Close</button>
          <div class="enterprise-eyebrow">V7.1 Production Report</div>
          <h2 id="enterpriseReportTitle"></h2>
          <p id="enterpriseReportMeta"></p>
          <div id="enterpriseReportBody" class="enterprise-report-body"></div>
        </section>`;
      document.body.appendChild(modal);
    }
    utils.setText("enterpriseReportTitle", report.title);
    utils.setText("enterpriseReportMeta", report.meta);
    const body = document.getElementById("enterpriseReportBody");
    if (body) body.innerHTML = report.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    modal.classList.add("show");
  }

  function togglePresentationMode() {
    const enabled = !document.body.classList.contains("presentation-mode");
    document.body.classList.toggle("presentation-mode", enabled);
    document.querySelectorAll("[data-enterprise-action='presentation']").forEach((button) => {
      button.textContent = enabled ? "Exit Presentation" : "Presentation Mode";
    });
    toast(enabled ? "Presentation Mode enabled." : "Presentation Mode disabled.");
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

  function ensureIntelligenceDeck() {
    let deck = document.getElementById("enterpriseIntelligenceDeck");
    if (deck) return deck;

    deck = el("section", "enterprise-intelligence-deck");
    deck.id = "enterpriseIntelligenceDeck";
    deck.setAttribute("aria-label", "V6 Enterprise Intelligence");
    const anchor = document.querySelector(".kpi-grid");
    if (anchor) anchor.insertAdjacentElement("afterend", deck);
    else document.querySelector(".main-content")?.appendChild(deck);
    return deck;
  }

  function safeTop(rows, fallback = "-") {
    return rows[0] || { name: fallback, units: 0, sales: 0, value: 0, gpPct: 0, share: 0 };
  }

  function safeBottom(rows, fallback = "-") {
    return rows.at(-1) || { name: fallback, units: 0, sales: 0, value: 0, gpPct: 0, share: 0 };
  }

  function valueCard(label, value, meta) {
    return `<article class="intel-value-card"><span>${label}</span><strong>${value}</strong><small>${meta}</small></article>`;
  }

  function miniRow(label, value, meta = "") {
    return `<div class="intel-row"><strong>${label}</strong><span>${value}</span>${meta ? `<small>${meta}</small>` : ""}</div>`;
  }

  function alertCard(level, title, text) {
    return `<article class="intel-alert-card"><span>${level}</span><strong>${title}</strong><p>${text}</p></article>`;
  }

  function actionCard(title, text, tag = "Next Best Action") {
    return `<article class="intel-action-card"><span>${tag}</span><strong>${title}</strong><p>${text}</p></article>`;
  }

  function placeholderCard(title, value, text) {
    return `<article class="intel-placeholder-card"><span>V6 foundation</span><strong>${title}</strong><b>${value}</b><p>${text}</p></article>`;
  }

  function renderCommonKpiWall(summary, groups) {
    const topDealer = safeTop(groups.dealers);
    const topModel = safeTop(groups.models);
    const forecast = Math.round(summary.units * 1.08);
    return `
      <div class="enterprise-kpi-wall">
        ${valueCard("Filtered Units", summary.units.toLocaleString(), "Live from dashboard_data.json")}
        ${valueCard("Sales Value", utils.formatMoney(summary.sales), "Current filter")}
        ${valueCard("GP Margin", utils.formatPercent(summary.gpPct), summary.gpPct < 8 ? "Margin pressure" : "Margin stable")}
        ${valueCard("Top Dealer", topDealer.name, `${utils.formatPercent(topDealer.share)} unit share`)}
        ${valueCard("Top Model", topModel.name, `${topModel.units.toLocaleString()} units`)}
        ${valueCard("Rule Forecast", forecast.toLocaleString(), "Static forecast placeholder")}
      </div>`;
  }

  function pageGroups(rows) {
    return {
      dealers: utils.groupBy(rows, (item) => item.dealer),
      salesmen: utils.groupBy(rows, utils.salesmanName),
      models: utils.groupBy(rows, (item) => item.model),
      types: utils.groupBy(rows, (item) => item.type),
      sources: utils.groupBy(rows, utils.sourceName),
      months: utils.groupBy(rows, (item) => utils.monthName(item.month)).reverse()
    };
  }

  function renderExecutiveDeck(summary, groups) {
    const topDealer = safeTop(groups.dealers);
    const weakDealer = safeBottom(groups.dealers);
    const topModel = safeTop(groups.models);
    const lowMargin = groups.models.slice().sort((a, b) => a.gpPct - b.gpPct)[0] || topModel;
    const forecast = Math.round(summary.units * 1.08);
    const target = Math.max(400, Math.round(summary.units * 1.12));
    const gap = forecast - target;
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel wide"><div class="enterprise-eyebrow">Executive Summary Panel</div><h2>${summary.units.toLocaleString()} units with ${utils.formatPercent(summary.gpPct)} GP margin</h2><p>${topDealer.name} leads dealer contribution while ${topModel.name} anchors product demand. The rule-based forecast shows ${gap >= 0 ? "an upside" : "a shortfall"} of ${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units against placeholder target.</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Alert Center</div>${alertCard(summary.gpPct < 8 ? "High" : "Watch", "Margin Quality", `${utils.formatPercent(summary.gpPct)} GP margin in the active filter.`)}${alertCard(topDealer.share > 45 ? "High" : "Review", "Dealer Dependency", `${topDealer.name} contributes ${utils.formatPercent(topDealer.share)} of units.`)}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Top 5 Risks</div>${[lowMargin, weakDealer, topDealer, topModel, safeTop(groups.types)].map((row, index) => miniRow(`${index + 1}. ${row.name}`, index === 0 ? "Margin" : `${row.units.toLocaleString()} units`, `Share ${utils.formatPercent(row.share || 0)}`)).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Next Best Actions</div>${actionCard("Protect margin", `Review discounting on ${lowMargin.name}.`)}${actionCard("Lift secondary dealers", `Follow up with ${weakDealer.name} on activity and stock blockers.`)}${actionCard("Secure availability", `Keep ${topModel.name} supply visible for close planning.`)}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Dealer Performance Snapshot</div>${groups.dealers.slice(0, 5).map((row) => miniRow(row.name, `${row.units.toLocaleString()} units`, `GP ${utils.formatPercent(row.gpPct)}`)).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Product Performance Snapshot</div>${groups.types.slice(0, 5).map((row) => miniRow(row.name, `${utils.formatPercent(row.share)} mix`, `${row.units.toLocaleString()} units`)).join("")}</section>
        <section class="intel-panel">${placeholderCard("Monthly Gap / Forecast", `${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units`, "Placeholder for V6 forecast center with target, actual, gap, and confidence controls.")}</section>
      </div>`;
  }

  function renderSalesDeck(summary, groups) {
    const bestMonth = safeTop(groups.months.slice().sort((a, b) => b.units - a.units));
    const source = safeTop(groups.sources);
    const model = safeTop(groups.models);
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel"><div class="enterprise-eyebrow">Sales Funnel Placeholder</div>${placeholderCard("Lead to Delivery", `${Math.round(summary.units * 1.6).toLocaleString()} bookings`, "Booking and landing snapshot is prepared when those fields are available in the source data.")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Sales Trend Comparison</div>${groups.months.slice(-5).map((row) => miniRow(row.name, `${row.units.toLocaleString()} units`, `Target ${Math.round(row.units * 1.15).toLocaleString()}`)).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Sales Source Analysis</div>${groups.sources.slice(0, 5).map((row) => miniRow(row.name, `${row.units.toLocaleString()} units`, `${utils.formatPercent(row.share)} share`)).join("")}</section>
        <section class="intel-panel wide"><div class="enterprise-eyebrow">AI Sales Insight Panel</div><h2>${bestMonth.name} is the strongest sales period</h2><p>${source.name} is the leading source and ${model.name} should anchor the close plan. Current GP margin is ${utils.formatPercent(summary.gpPct)}.</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Action Recommendation Cards</div>${actionCard("Push high-probability leads", `Prioritize ${source.name} leads with ${model.name} offers.`)}${actionCard("Protect payment quality", "Review payment mix before accelerating volume.")}${actionCard("Use monthly rhythm", `Replicate ${bestMonth.name} activity cadence.`)}</section>
      </div>`;
  }

  function renderSalesmanDeck(summary, groups) {
    const leader = safeTop(groups.salesmen);
    const coach = groups.salesmen.slice().sort((a, b) => a.gpPct - b.gpPct)[0] || leader;
    const source = safeTop(groups.sources);
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel wide"><div class="enterprise-eyebrow">Coaching Insight Panel</div><h2>${leader.name} leads the team</h2><p>${coach.name} is the coaching focus for margin or conversion. Route best ${source.name} leads through proven playbooks and track follow-up quality weekly.</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Salesman Ranking</div>${groups.salesmen.slice(0, 5).map((row, index) => miniRow(`${index + 1}. ${row.name}`, `${row.units.toLocaleString()} units`, `GP ${utils.formatPercent(row.gpPct)}`)).join("")}</section>
        <section class="intel-panel">${placeholderCard("Performance Matrix", "Volume x GP", "Matrix is prepared for quadrant scoring, coaching paths, and achievement targets.")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Product Specialization Summary</div>${groups.types.slice(0, 4).map((row) => miniRow(row.name, `${row.units.toLocaleString()} units`, `${utils.formatPercent(row.share)} mix`)).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Lead Source Insight</div>${groups.sources.slice(0, 4).map((row) => miniRow(row.name, `${row.units.toLocaleString()} leads`, `Share ${utils.formatPercent(row.share)}`)).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Action Recommendation Cards</div>${actionCard("Coach margin control", `Review ${coach.name} discount pattern.`)}${actionCard("Scale leader behavior", `Turn ${leader.name} routines into a team checklist.`)}${actionCard("Specialize by product", `Assign specialists around ${safeTop(groups.types).name}.`)}</section>
      </div>`;
  }

  function renderProductDeck(summary, groups) {
    const topModel = safeTop(groups.models);
    const slow = safeBottom(groups.models);
    const highGp = groups.models.slice().sort((a, b) => b.gpPct - a.gpPct)[0] || topModel;
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel wide"><div class="enterprise-eyebrow">Model Ranking Highlight</div><h2>${topModel.name} is the lead demand signal</h2><p>${topModel.units.toLocaleString()} units sold with ${utils.formatPercent(topModel.share)} share. ${highGp.name} has the strongest GP quality at ${utils.formatPercent(highGp.gpPct)}.</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Product Mix Insight</div>${groups.types.slice(0, 5).map((row) => miniRow(row.name, `${utils.formatPercent(row.share)} mix`, `${row.units.toLocaleString()} units`)).join("")}</section>
        <section class="intel-panel">${placeholderCard("Slow-Moving / Risk", slow.name, "Prepared for inventory age, slow movement, and dealer stock risk scoring.")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Product Recommendation Cards</div>${actionCard("Anchor campaigns", `Use ${topModel.name} demand in dealer campaigns.`)}${actionCard("Protect GP", `Preserve pricing on ${highGp.name}.`)}${actionCard("Watch slow movement", `Review stock and offers for ${slow.name}.`)}</section>
      </div>`;
  }

  function renderDealerDeck(summary, groups) {
    const dealer = safeTop(groups.dealers);
    const weak = safeBottom(groups.dealers);
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel"><div class="enterprise-eyebrow">Dealer Ranking</div>${groups.dealers.slice(0, 5).map((row, index) => miniRow(`${index + 1}. ${row.name}`, `${row.units.toLocaleString()} units`, `${utils.formatPercent(row.share)} share`)).join("")}</section>
        <section class="intel-panel">${placeholderCard("Dealer Score", `${Math.min(99, Math.round((dealer.share || 0) + 62))}/100`, "Composite score placeholder for sales, stock, collection, service, and coverage.")}</section>
        <section class="intel-panel wide"><div class="enterprise-eyebrow">Dealer Health Insight</div><h2>${dealer.name} leads network performance</h2><p>${weak.name} needs activity review. Dealer concentration is ${utils.formatPercent(dealer.share)}, so secondary dealer lift remains important for resilience.</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Dealer Action Cards</div>${actionCard("Reduce dependency", `Lift activity for ${weak.name}.`)}${actionCard("Protect leader", `Keep stock availability visible for ${dealer.name}.`)}${actionCard("Weekly scorecard", "Track sales, collection, and stock age together.")}</section>
      </div>`;
  }

  function renderForecastDeck(summary, groups) {
    const forecast = Math.max(363, Math.round(summary.units * 1.08));
    const target = 400;
    const gap = forecast - target;
    const confidence = Math.max(62, Math.min(92, Math.round(86 + summary.gpPct / 3 - Math.abs(gap) / 80)));
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel"><div class="enterprise-eyebrow">Forecast vs Actual</div>${miniRow("Actual", `${summary.units.toLocaleString()} units`, "Filtered records")}${miniRow("Forecast", `${forecast.toLocaleString()} units`, "Rule-based placeholder")}${miniRow("Target", `${target.toLocaleString()} units`, "Static planning baseline")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">Gap Analysis Panel</div>${miniRow("Gap", `${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units`, gap < 0 ? "Needs recovery" : "Above target")}${miniRow("Value Forecast", utils.formatMoney(summary.sales * 1.08), "Estimated")}</section>
        <section class="intel-panel wide"><div class="enterprise-eyebrow">Risk / Opportunity Insight</div><h2>${gap < 0 ? "Target gap requires action" : "Forecast is on track"}</h2><p>${safeTop(groups.dealers).name} and ${safeTop(groups.salesmen).name} are the strongest levers in the current filter. Use high-probability deals first, then protect GP margin.</p></section>
        <section class="intel-panel">${placeholderCard("Forecast Confidence", `${confidence}%`, "Prepared for future scenario weighting, pipeline probability, and confidence model controls.")}</section>
      </div>`;
  }

  function renderIntelligenceDeck(rows) {
    const deck = document.getElementById("enterpriseIntelligenceDeck");
    if (!deck) return;
    const config = pageConfig();
    const summary = utils.kpi(rows);
    const groups = pageGroups(rows);
    const renderers = {
      executive: renderExecutiveDeck,
      sales: renderSalesDeck,
      salesman: renderSalesmanDeck,
      product: renderProductDeck,
      dealer: renderDealerDeck,
      forecast: renderForecastDeck
    };
    deck.innerHTML = (renderers[config.module] || renderExecutiveDeck)(summary, groups);
  }

  function themeClass(name, enabled = true) {
    document.documentElement.classList.toggle(`enterprise-${name}`, enabled);
  }

  function renderExports() {
    const target = document.getElementById("enterpriseExportActions");
    if (!target || target.dataset.ready === "true") return;
    exportKinds.forEach((kind) => {
      const button = el("button", "export-button", exportLabels[kind] || `Export ${kind}`);
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
      const reportButton = event.target.closest("[data-enterprise-report]");
      if (reportButton) {
        showReport(reportButton.dataset.enterpriseReport);
        return;
      }
      if (event.target.closest("[data-enterprise-modal-close]") || event.target.id === "enterpriseReportModal") {
        document.getElementById("enterpriseReportModal")?.classList.remove("show");
        return;
      }
      const action = event.target.closest("[data-enterprise-action]")?.dataset.enterpriseAction;
      if (action === "ai") {
        const summary = executiveSummary(rowsForInsight(latestRows));
        toast(`AI Summary: ${summary.overall} ${summary.nextAction}`);
      }
      if (action === "refresh") {
        BI.enterprise.refresh();
        toast("Dashboard view refreshed from current filters.");
      }
      if (action === "presentation") {
        togglePresentationMode();
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
    latestRows = data;
    const config = pageConfig();
    const insight = insightFor(config.insight, data);
    const summary = executiveSummary(data);
    ensureHeader();
    ensureInsightPanel();
    ensureIntelligenceDeck();
    ensureFoundationPanel();
    ensureInsightEnginePanel();
    enhanceKpis();
    enhancePanels();
    updateEmptyStates(data);
    renderIntelligenceDeck(data);
    renderInsightEngine(data);
    utils.setText("enterpriseLastRefresh", utils.lastRefresh());
    utils.setText("enterpriseInsightHeadline", summary.overall || insight.headline);
    utils.setText("enterpriseInsightDetail", `${summary.leadingDealer} ${summary.leadingProduct} ${summary.margin}` || insight.detail);
    utils.setText("enterpriseInsightAction", summary.nextAction || insight.action);
    utils.setText("enterpriseInsightRisk", summary.forecastRisk || insight.risk);
  }

  function ensureFooter() {
    if (document.getElementById("enterpriseFooter")) return;
    const footer = el("footer", "enterprise-footer");
    footer.id = "enterpriseFooter";
    footer.innerHTML = "<strong>KMM Sales Intelligence V7.1 Production Ready</strong><span>Static GitHub Pages dashboard | Local data only | CSV/PNG export foundation | V7.2 PDF/PPT roadmap</span>";
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
    executiveSummary,
    reportLines,
    handleExport,
    renderAiInsight,
    premiumCard,
    themeClass,
    toast
  };

  document.addEventListener("DOMContentLoaded", init);
  window.BI = BI;
})(window);
