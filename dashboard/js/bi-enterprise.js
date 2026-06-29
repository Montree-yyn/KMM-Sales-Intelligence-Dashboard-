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
    PDF: "export.pdf",
    PowerPoint: "export.powerpoint",
    Excel: "export.csv",
    PNG: "export.png"
  };
  let latestRows = [];

  const moduleLabels = {
    Executive: ["Executive", "ผู้บริหาร"],
    Sales: ["Sales", "ยอดขาย"],
    Product: ["Product", "สินค้า"],
    Dealer: ["Dealer", "Dealer"],
    Salesman: ["Salesman", "พนักงานขาย"],
    Coaching: ["Coaching", "โค้ชทีมขาย"],
    Achievement: ["Achievement", "ผลงานเทียบเป้า"],
    Activity: ["Activity", "กิจกรรม"],
    Channel: ["Channel", "ช่องทาง"],
    Payment: ["Payment", "การชำระเงิน"],
    Trend: ["Trend", "แนวโน้ม"],
    Inventory: ["Inventory", "สต็อก"],
    Margin: ["Margin", "กำไร"],
    Heatmap: ["Heatmap", "Heatmap"],
    Health: ["Health", "สุขภาพ"],
    Collection: ["Collection", "การเก็บเงิน"],
    Coverage: ["Coverage", "พื้นที่"],
    Forecast: ["Forecast", "คาดการณ์"],
    Pipeline: ["Pipeline", "Pipeline"],
    Target: ["Target", "เป้าหมาย"],
    Scenario: ["Scenario", "Scenario"]
  };

  const pageEyebrows = {
    executive: ["V7.1 Production Ready Executive Cockpit", "V7.1 ห้องควบคุมผู้บริหารพร้อมใช้งาน"],
    salesman: ["V5.2 Performance Coaching", "V5.2 โค้ชผลงานพนักงานขาย"],
    sales: ["V5.2 Commercial Analytics", "V5.2 วิเคราะห์ยอดขายเชิงพาณิชย์"],
    product: ["V5.2 Product Intelligence", "V5.2 วิเคราะห์สินค้า"],
    dealer: ["V5.2 Dealer Network Health", "V5.2 สุขภาพเครือข่าย Dealer"],
    forecast: ["V5.2 Forecast AI Foundation", "V5.2 พื้นฐานคาดการณ์ AI"]
  };

  function t(key) {
    return window.KMMI18n ? window.KMMI18n.t(key) : key;
  }

  function isThai() {
    return window.KMMI18n ? window.KMMI18n.getLanguage() === "th" : true;
  }

  function unitText(value) {
    return isThai() ? `${Number(value || 0).toLocaleString()} คัน` : `${Number(value || 0).toLocaleString()} units`;
  }

  function local(en, th) {
    return isThai() ? th : en;
  }

  function labelForInsight(title) {
    const labels = {
      "Sales Performance": local("Sales Performance", "ผลงานยอดขาย"),
      "Dealer Performance": local("Dealer Performance", "ผลงาน Dealer"),
      "Product Performance": local("Product Performance", "ผลงานสินค้า"),
      "Forecast Risk": local("Forecast Risk", "ความเสี่ยงคาดการณ์"),
      "Low GP Warning": local("Low GP Warning", "แจ้งเตือน GP ต่ำ"),
      "Top Performer": local("Top Performer", "ผู้ทำผลงานสูงสุด")
    };
    return labels[title] || title;
  }

  function severityLabel(value) {
    const labels = {
      Strong: "แข็งแรง",
      Review: "ต้องทบทวน",
      Dependency: "พึ่งพาสูง",
      Balanced: "สมดุล",
      Concentrated: "กระจุกตัว",
      Healthy: "สุขภาพดี",
      Gap: "มีส่วนต่าง",
      "On Track": "ตามแผน",
      High: "สูง",
      Stable: "มั่นคง",
      Leader: "ผู้นำ",
      Ready: "พร้อม"
    };
    return isThai() ? (labels[value] || value) : value;
  }

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
      severity: t("message.loading"),
      headline: t("message.noDataCurrent"),
      detail: t("message.adjustFilters"),
      action: t("message.safePlaceholder")
    };
  }

  function insightSet(rows) {
    if (!rows.length) {
      return [
        emptyInsight(labelForInsight("Sales Performance")),
        emptyInsight(labelForInsight("Dealer Performance")),
        emptyInsight(labelForInsight("Product Performance")),
        emptyInsight(labelForInsight("Forecast Risk")),
        emptyInsight(labelForInsight("Low GP Warning")),
        emptyInsight(labelForInsight("Top Performer"))
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
        title: labelForInsight("Sales Performance"),
        severity: severityLabel(kpi.units >= 400 ? "Strong" : "Review"),
        headline: local(`${kpi.units.toLocaleString()} units sold`, `ขายแล้ว ${unitText(kpi.units)}`),
        detail: local(`${monthly[0]?.name || "-"} is the strongest month with ${utils.formatMoney(kpi.sales)} total sales value.`, `${monthly[0]?.name || "-"} เป็นเดือนที่แข็งแรงที่สุด มูลค่ายอดขายรวม ${utils.formatMoney(kpi.sales)}`),
        action: kpi.units >= 400 ? local("Maintain close rhythm and protect margin quality.", "รักษาจังหวะปิดการขายและปกป้องคุณภาพกำไร") : local("Use dealer and salesman follow-up to close the volume gap.", "ใช้การติดตาม Dealer และพนักงานขายเพื่อปิดส่วนต่างจำนวนขาย")
      },
      {
        title: labelForInsight("Dealer Performance"),
        severity: severityLabel(dealer.share > 45 ? "Dependency" : "Balanced"),
        headline: local(`${dealer.name} leads dealer contribution`, `${dealer.name} เป็น Dealer ที่มีสัดส่วนสูงสุด`),
        detail: local(`${dealer.units.toLocaleString()} units and ${utils.formatPercent(dealer.share)} share. Lowest filtered contribution: ${weakDealer.name}.`, `${unitText(dealer.units)} และสัดส่วน ${utils.formatPercent(dealer.share)} โดยผลงานต่ำสุดในตัวกรองคือ ${weakDealer.name}`),
        action: dealer.share > 45 ? local("Lift secondary dealer activity to reduce dependency risk.", "เพิ่มกิจกรรม Dealer รองเพื่อลดความเสี่ยงการพึ่งพา") : local("Keep weekly dealer scorecards active.", "ติดตาม scorecard Dealer รายสัปดาห์ต่อเนื่อง")
      },
      {
        title: labelForInsight("Product Performance"),
        severity: severityLabel(productType.share > 60 ? "Concentrated" : "Healthy"),
        headline: local(`${product.name} is the top model`, `${product.name} เป็นรุ่นขายสูงสุด`),
        detail: local(`${productType.name} contributes ${utils.formatPercent(productType.share)} of filtered units.`, `${productType.name} คิดเป็น ${utils.formatPercent(productType.share)} ของจำนวนขายตามตัวกรอง`),
        action: productType.share > 60 ? local("Prepare substitute model offers and watch concentration risk.", "เตรียมข้อเสนอรุ่นทดแทนและติดตามความเสี่ยงการกระจุกตัว") : local("Use top-model demand to open adjacent product conversations.", "ใช้ความต้องการรุ่นหลักเพื่อเปิดการขายสินค้าที่เกี่ยวข้อง")
      },
      {
        title: labelForInsight("Forecast Risk"),
        severity: severityLabel(gap < 0 ? "Gap" : "On Track"),
        headline: local(`${forecast.toLocaleString()} unit rule-based forecast`, `คาดการณ์ตามกฎ ${unitText(forecast)}`),
        detail: local(`Static target placeholder is ${target.toLocaleString()} units, leaving ${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units gap.`, `เป้าหมาย Static คือ ${unitText(target)} เหลือส่วนต่าง ${gap >= 0 ? "+" : ""}${unitText(gap)}`),
        action: gap < 0 ? local("Prioritize high-probability deals and top dealer follow-up.", "ให้ความสำคัญกับดีลโอกาสสูงและการติดตาม Dealer หลัก") : local("Forecast is above baseline; protect GP while closing.", "คาดการณ์สูงกว่า baseline ให้ปกป้อง GP ระหว่างปิดการขาย")
      },
      {
        title: labelForInsight("Low GP Warning"),
        severity: severityLabel(lowGp ? "High" : "Stable"),
        headline: local(`${utils.formatPercent(kpi.gpPct)} GP margin`, `GP margin ${utils.formatPercent(kpi.gpPct)}`),
        detail: local(`${lowMarginProduct.name} is the lowest-margin model at ${utils.formatPercent(lowMarginProduct.gpPct)}.`, `${lowMarginProduct.name} เป็นรุ่นกำไรต่ำสุดที่ ${utils.formatPercent(lowMarginProduct.gpPct)}`),
        action: lowGp ? local("Review discounts, campaigns, and cost leakage before adding volume pressure.", "ทบทวนส่วนลด แคมเปญ และต้นทุนรั่วไหลก่อนเร่งจำนวนขาย") : local("Margin is stable. Keep price discipline visible.", "กำไรมั่นคง ให้รักษาวินัยด้านราคา")
      },
      {
        title: labelForInsight("Top Performer"),
        severity: severityLabel("Leader"),
        headline: local(`${salesman.name} leads filtered performance`, `${salesman.name} นำผลงานตามตัวกรอง`),
        detail: local(`${salesman.units.toLocaleString()} units, ${utils.formatPercent(salesman.share)} share, and ${utils.formatPercent(salesman.gpPct)} GP margin.`, `${unitText(salesman.units)}, สัดส่วน ${utils.formatPercent(salesman.share)} และ GP margin ${utils.formatPercent(salesman.gpPct)}`),
        action: local("Turn top performer behavior into a coaching reference for the team.", "นำพฤติกรรมของผู้ทำผลงานสูงสุดไปใช้เป็นแนวทางโค้ชทีม")
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

  function detectCopilotIntent(question) {
    const text = String(question || "").toLowerCase();
    if (/(dealer|branch|network|attention|watch|weak|risk dealer)/.test(text)) return "dealer";
    if (/(product|model|push|portfolio|mix|gp model|margin model)/.test(text)) return "product";
    if (/(forecast|target|gap|risk|projection|next period)/.test(text)) return "forecast";
    if (/(action|recommend|next best|priority|do next|decision)/.test(text)) return "action";
    if (/(sales|performance|revenue|kpi|current|unit|gp|margin)/.test(text)) return "sales";
    return "summary";
  }

  function copilotPlaceholder(question, rows) {
    return {
      intent: detectCopilotIntent(question),
      question: String(question || "").trim(),
      headline: "Copilot answer pending filtered data",
      meta: "No matching rows in the current filter selection.",
      cards: [
        {
          type: "kpi",
          label: t("ai.kpiSummary"),
          title: t("message.noDataCurrent"),
          text: "The copilot cannot calculate sales units, value, or GP margin until the current filters return records."
        },
        {
          type: "dealer",
          label: t("ai.dealerInsight"),
          title: "Dealer signal unavailable",
          text: "Dealer leadership and attention signals will appear when filtered dealer records are available."
        },
        {
          type: "product",
          label: t("ai.productInsight"),
          title: "Product signal unavailable",
          text: "Product push guidance needs filtered model and product type records."
        },
        {
          type: "forecast",
          label: t("ai.forecastInsight"),
          title: t("ai.forecastRisk"),
          text: "The rule-based forecast placeholder will update after sales records are available."
        },
        {
          type: "action",
          label: t("ai.recommendedAction"),
          title: "Reset or broaden filters",
          text: rows && rows.length === 0 ? "Use broader filters before making an executive decision." : "Load dashboard_data.json to activate local copilot answers."
        }
      ]
    };
  }

  function generateCopilotAnswer(rows, question) {
    const data = rowsForInsight(rows);
    const prompt = String(question || "").trim();
    if (!data.length) return copilotPlaceholder(prompt, data);

    const intent = detectCopilotIntent(prompt);
    const kpi = utils.kpi(data);
    const summary = executiveSummary(data);
    const dealers = utils.groupBy(data, (item) => item.dealer);
    const products = utils.groupBy(data, (item) => item.model);
    const types = utils.groupBy(data, (item) => item.type);
    const salesmen = utils.groupBy(data, utils.salesmanName);
    const topDealer = safeTop(dealers);
    const weakDealer = safeBottom(dealers);
    const topProduct = safeTop(products);
    const highGpProduct = safeTop(products.slice().sort((a, b) => b.gpPct - a.gpPct));
    const lowGpProduct = safeTop(products.slice().sort((a, b) => a.gpPct - b.gpPct));
    const topType = safeTop(types);
    const topSalesman = safeTop(salesmen);
    const forecast = summary.forecast || Math.round(kpi.units * 1.08);
    const target = summary.target || Math.max(400, Math.round(kpi.units * 1.12));
    const gap = forecast - target;
    const dealerRisk = topDealer.share > 45 ? "High concentration" : weakDealer.units <= 1 ? "Low activity pocket" : "Balanced watch";
    const marginRisk = kpi.gpPct < 8 ? "margin pressure" : kpi.gpPct < 11 ? "margin watch" : "healthy margin";
    const forecastRisk = gap < 0 ? "target gap" : "on track";
    const productPush = highGpProduct.name !== "-" ? highGpProduct : topProduct;
    const nextAction = copilotAction(intent, { gap, kpi, weakDealer, topDealer, topProduct, productPush, lowGpProduct, topSalesman });
    const headlineMap = {
      sales: `Sales performance: ${kpi.units.toLocaleString()} units and ${utils.formatMoney(kpi.sales)} sales value`,
      dealer: `Dealer attention: review ${weakDealer.name} while managing ${topDealer.name} concentration`,
      product: `Product push: prioritize ${productPush.name} with ${utils.formatPercent(productPush.gpPct)} GP margin`,
      forecast: `Forecast risk: ${forecast.toLocaleString()} units versus ${target.toLocaleString()} target`,
      action: `Next best action: ${nextAction}`,
      summary: "Executive copilot summary from current filters"
    };

    return {
      intent,
      question: prompt,
      headline: headlineMap[intent] || headlineMap.summary,
      meta: `Generated from ${data.length.toLocaleString()} filtered local records. Intent: ${intent}.`,
      cards: [
        {
          type: "kpi",
          label: t("ai.kpiSummary"),
          title: `${kpi.units.toLocaleString()} units | ${utils.formatMoney(kpi.sales)} sales`,
          text: `Gross profit is ${utils.formatMoney(kpi.gp)} and GP margin is ${utils.formatPercent(kpi.gpPct)}, indicating ${marginRisk}.`
        },
        {
          type: "dealer",
          label: t("ai.dealerInsight"),
          title: `${weakDealer.name} needs attention`,
          text: `${topDealer.name} leads with ${topDealer.units.toLocaleString()} units and ${utils.formatPercent(topDealer.share)} share. ${weakDealer.name} is lowest in the current filter; dealer risk signal is ${dealerRisk}.`
        },
        {
          type: "product",
          label: t("ai.productInsight"),
          title: `${productPush.name} is the push candidate`,
          text: `${topProduct.name} leads volume with ${topProduct.units.toLocaleString()} units. ${topType.name} leads product type mix, while ${lowGpProduct.name} should be watched for GP quality.`
        },
        {
          type: "forecast",
          label: t("ai.forecastInsight"),
          title: `${gap >= 0 ? "+" : ""}${gap.toLocaleString()} unit forecast gap`,
          text: `Rule-based forecast is ${forecast.toLocaleString()} units against ${target.toLocaleString()} baseline target, showing ${forecastRisk}.`
        },
        {
          type: "action",
          label: t("ai.recommendedAction"),
          title: t("ai.nextBestAction"),
          text: nextAction
        }
      ]
    };
  }

  function copilotAction(intent, context) {
    if (intent === "dealer") return `Lift activity and stock visibility for ${context.weakDealer.name}, while reducing over-reliance on ${context.topDealer.name}.`;
    if (intent === "product") return `Push ${context.productPush.name} first, then review margin pressure on ${context.lowGpProduct.name}.`;
    if (intent === "forecast") {
      return context.gap < 0
        ? `Recover ${Math.abs(context.gap).toLocaleString()} units through high-probability dealer and salesman follow-up.`
        : "Protect GP quality while keeping the close rhythm ahead of the baseline target.";
    }
    if (intent === "sales") return `Use ${context.topDealer.name}, ${context.topProduct.name}, and ${context.topSalesman.name} as the performance benchmark for the next review.`;
    return context.gap < 0
      ? `Close the forecast gap first, starting with ${context.weakDealer.name} follow-up and ${context.topProduct.name} deal conversion.`
      : `Maintain weekly close discipline and keep ${context.productPush.name} available across priority dealers.`;
  }

  function reportLines(kind, rows) {
    const summary = executiveSummary(rows);
    const titleMap = {
      weekly: t("report.weeklyTitle"),
      monthly: t("report.monthlyTitle"),
      executive: t("report.executive"),
      dealer: t("report.dealer")
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
        meta: t("message.noDataFilters"),
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
      meta: `Generated from ${rows.length.toLocaleString()} filtered local records. ${t("kpi.lastRefresh")} ${utils.lastRefresh()}.`,
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
        <div class="enterprise-eyebrow">${local(pageEyebrows[config.module]?.[0] || config.eyebrow, pageEyebrows[config.module]?.[1] || config.eyebrow)}</div>
        <h1 data-i18n="page.${config.module}.title">${t(`page.${config.module}.title`)}</h1>
        <p data-i18n="page.${config.module}.subtitle">${t(`page.${config.module}.subtitle`)}</p>
        <div class="enterprise-refresh"><span data-i18n="kpi.lastRefresh">Last Refresh</span> <strong id="enterpriseLastRefresh">${t("message.loading")}</strong></div>
      </div>
      <div class="enterprise-actions" aria-label="${local("Dashboard actions", "การดำเนินการแดชบอร์ด")}">
        <button type="button" class="enterprise-action primary" data-enterprise-action="ai" data-i18n="button.aiSummary">AI Summary</button>
        ${config.module === "executive" ? '<button type="button" class="enterprise-action" data-enterprise-action="presentation" data-i18n="button.presentationMode">Presentation Mode</button>' : ""}
        <button type="button" class="enterprise-action" data-enterprise-action="refresh" data-i18n="button.refreshView">Refresh View</button>
        <button type="button" class="enterprise-action" data-enterprise-export="PDF" data-i18n="export.pdf">Export PDF</button>
        <button type="button" class="enterprise-action" data-enterprise-export="PowerPoint" data-i18n="export.powerpoint">Export PowerPoint</button>
        <button type="button" class="enterprise-action" data-enterprise-export="Excel" data-i18n="export.csv">Export CSV</button>
        <button type="button" class="enterprise-action" data-enterprise-export="PNG" data-i18n="export.png">Export PNG</button>
      </div>`;
    if (window.KMMI18n) window.KMMI18n.applyTranslations(header);
  }

  function ensureInsightPanel() {
    let panel = document.getElementById("enterpriseInsightPanel");
    if (panel) return panel;

    const config = pageConfig();
    panel = el("section", "enterprise-insight-panel");
    panel.id = "enterpriseInsightPanel";
    panel.setAttribute("aria-label", t("ai.executiveInsight"));
    panel.innerHTML = `
      <div class="insight-orb">${config.icon}</div>
      <div class="insight-copy">
        <div class="enterprise-eyebrow" data-i18n="ai.executiveInsight">Executive Summary / AI Insight</div>
        <h2 id="enterpriseInsightHeadline" data-i18n="ai.loadingInsight">Loading insight...</h2>
        <p id="enterpriseInsightDetail" data-i18n="ai.ruleBasedLoading">Rule-based analysis will appear after dashboard data loads.</p>
      </div>
      <div class="insight-action-card">
        <span id="enterpriseInsightRisk" data-i18n="message.localDataOnly">Local data only</span>
        <strong id="enterpriseInsightAction" data-i18n="ai.noExternalApi">No external AI API is connected.</strong>
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
        <div class="enterprise-eyebrow" data-i18n="label.dashboardModules">${t("label.dashboardModules")}</div>
        <h2 data-i18n="label.enterpriseCoverage">${t("label.enterpriseCoverage")}</h2>
        <div id="enterpriseModuleList" class="module-pills"></div>
      </div>
      <div class="enterprise-block export-card">
        <div class="enterprise-eyebrow" data-i18n="export.foundation">Export Foundation</div>
        <h2 data-i18n="export.preparedOutputs">Prepared Outputs</h2>
        <div class="export-actions" id="enterpriseExportActions"></div>
        <p id="enterpriseExportStatus" class="export-status" data-i18n="export.ready">V7.1 Export Center prepared.</p>
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
          <div class="enterprise-eyebrow" data-i18n="ai.engine">AI Insight Engine</div>
          <h2 data-i18n="ai.ruleBased">V6 Rule-Based Insights</h2>
        </div>
        <span data-i18n="ai.localOnly">Local dashboard_data.json only</span>
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
    target.innerHTML = config.modules.map((module) => {
      const labels = moduleLabels[module] || [module, module];
      return `<span class="module-pill is-active">${local(labels[0], labels[1])}<small>${t("message.ready")}</small></span>`;
    }).join("");
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
    if (!target) throw new Error(t("error.dashboardUnavailable"));

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
          reject(new Error(t("error.pngFailed")));
          return;
        }
        downloadFile("kmm-v7-1-dashboard.png", "image/png", blob);
        resolve();
      }, "image/png");
    });
  }

  async function handleExport(kind) {
    let message = t("export.completed");
    const status = document.getElementById("enterpriseExportStatus");
    if (kind === "PDF") message = t("export.pdfPrepared");
    if (kind === "PowerPoint") message = t("export.pptPrepared");
    if (kind === "Excel") {
      exportCsv();
      message = t("export.csvDownloaded");
    }
    if (kind === "PNG") {
      try {
        await exportPng();
        message = t("export.pngAttempted");
      } catch (error) {
        message = t("export.pngFailed");
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
          <button type="button" class="enterprise-modal-close" data-enterprise-modal-close data-i18n-aria="button.close" aria-label="Close report" data-i18n="button.close">Close</button>
          <div class="enterprise-eyebrow" data-i18n="report.production">V7.1 Production Report</div>
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
      button.textContent = enabled ? t("button.exitPresentation") : t("button.presentationMode");
    });
    toast(enabled ? t("message.presentationEnabled") : t("message.presentationDisabled"));
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
      const button = el("button", "export-button", t(exportLabels[kind]) || `Export ${kind}`);
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
        toast(`${t("ai.summary")}: ${summary.overall} ${summary.nextAction}`);
      }
      if (action === "refresh") {
        BI.enterprise.refresh();
        toast(t("message.viewRefreshed"));
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
      card.insertAdjacentHTML("afterbegin", `<div class="kpi-icon" aria-hidden="true">${kpiIcons[index % kpiIcons.length]}</div><div class="kpi-mini">${t("message.liveKpi")}</div>`);
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
        wrap.insertAdjacentHTML("beforeend", `<span class="panel-status">${t("message.ready")}</span>`);
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
          empty = el("div", "enterprise-empty-state", t("message.noDataFilters"));
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
    footer.innerHTML = `<strong>KMM Sales Intelligence V7.1 Production Ready</strong><span>Static GitHub Pages dashboard | ${t("message.localDataOnly")} | CSV/PNG export foundation | V7.2 PDF/PPT roadmap</span>`;
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
    if (window.KMMI18n) window.KMMI18n.applyTranslations(document);
  }

  BI.enterprise = {
    pages,
    init,
    refresh,
    insightFor,
    executiveSummary,
    generateCopilotAnswer,
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
