(function (window) {
  "use strict";

  const BI = window.BI || {};
  const utils = BI.utils;

  const pages = {
    "executive.html": {
      module: "executive",
      eyebrow: "V10 Production Release Executive Cockpit",
      title: "Executive Intelligence Cockpit",
      subtitle: "Company-wide revenue, unit sales, margin quality, dealer concentration, production reports, practical exports, and forecast action in one leadership view.",
      insight: "executive",
      icon: "⌂",
      modules: ["Executive", "Sales", "Product", "Dealer"]
    },
    "salesman.html": {
      module: "salesman",
      eyebrow: "V10 Performance Coaching",
      title: "Sales Performance",
      subtitle: "Salesman productivity, achievement ranking, activity quality, and coaching opportunities.",
      insight: "salesman",
      icon: "◉",
      modules: ["Salesman", "Coaching", "Achievement", "Activity"]
    },
    "sales.html": {
      module: "sales",
      eyebrow: "V10 Commercial Analytics",
      title: "Sales Analytics",
      subtitle: "Period performance, channel mix, payment behavior, and product contribution trends.",
      insight: "sales",
      icon: "↗",
      modules: ["Sales", "Channel", "Payment", "Trend"]
    },
    "product.html": {
      module: "product",
      eyebrow: "V10 Product Intelligence",
      title: "Product Intelligence",
      subtitle: "Model demand, product mix, GP quality, inventory signals, and cross-dealer movement.",
      insight: "product",
      icon: "▣",
      modules: ["Product", "Inventory", "Margin", "Heatmap"]
    },
    "dealer.html": {
      module: "dealer",
      eyebrow: "V10 Dealer Network Health",
      title: "Dealer Intelligence",
      subtitle: "Dealer contribution, health signals, pipeline conversion, stock age, and coverage priorities.",
      insight: "dealer",
      icon: "◆",
      modules: ["Dealer", "Health", "Collection", "Coverage"]
    },
    "forecast.html": {
      module: "forecast",
      eyebrow: "V10 Forecast Foundation",
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
    executive: ["V10 Production Release Executive Cockpit", "V10 ห้องควบคุมผู้บริหาร Production Release"],
    salesman: ["V10 Performance Coaching", "V10 โค้ชผลงานพนักงานขาย"],
    sales: ["V10 Commercial Analytics", "V10 วิเคราะห์ยอดขายเชิงพาณิชย์"],
    product: ["V10 Product Intelligence", "V10 วิเคราะห์สินค้า"],
    dealer: ["V10 Dealer Network Health", "V10 สุขภาพเครือข่าย Dealer"],
    forecast: ["V10 Forecast Foundation", "V10 พื้นฐานคาดการณ์"]
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

  function monthName(value) {
    const monthsTh = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return isThai() ? (monthsTh[Number(value)] || value || "-") : utils.monthName(value);
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
    const monthly = utils.groupBy(rows, (item) => monthName(item.month)).sort((a, b) => b.units - a.units);
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
        headline: t("message.noDataCurrent"),
        detail: t("message.adjustFilters"),
        action: t("message.noExternalApiUsed"),
        risk: t("message.waitingForData")
      };
    }

    const kpi = utils.kpi(rows);
    const dealer = groupedTop(rows, (item) => item.dealer);
    const salesman = groupedTop(rows, utils.salesmanName);
    const product = groupedTop(rows, (item) => item.model);
    const typeMix = groupedTop(rows, (item) => item.type);
    const monthly = utils.groupBy(rows, (item) => monthName(item.month)).sort((a, b) => b.units - a.units);
    const weakestDealer = utils.groupBy(rows, (item) => item.dealer).at(-1) || dealer;
    const forecast = Math.round(kpi.units * 1.08);
    const marginSignal = kpi.gpPct < 8
      ? local("Margin pressure", "แรงกดดันกำไร")
      : kpi.gpPct < 12 ? local("Balanced margin", "กำไรสมดุล") : local("Premium margin", "กำไรระดับดี");

    const library = {
      executive: {
        headline: local(`${kpi.units.toLocaleString()} units with ${utils.formatPercent(kpi.gpPct)} GP margin`, `${unitText(kpi.units)} พร้อม GP margin ${utils.formatPercent(kpi.gpPct)}`),
        detail: local(`${dealer.name} leads dealer contribution at ${utils.formatPercent(dealer.share)} share, while ${product.name} is the strongest model.`, `${dealer.name} นำสัดส่วน Dealer ที่ ${utils.formatPercent(dealer.share)} และ ${product.name} เป็นรุ่นที่แข็งแรงที่สุด`),
        action: kpi.gpPct < 8 ? local("Prioritize margin protection before chasing extra volume.", "ให้ความสำคัญกับการปกป้องกำไรก่อนเร่งจำนวนขาย") : local("Maintain executive focus on top model availability and weekly close rhythm.", "ผู้บริหารควรโฟกัสความพร้อมรุ่นหลักและจังหวะปิดรายสัปดาห์"),
        risk: marginSignal
      },
      salesman: {
        headline: local(`${salesman.name} leads the filtered sales team`, `${salesman.name} นำทีมขายตามตัวกรอง`),
        detail: local(`${salesman.units.toLocaleString()} units, ${utils.formatPercent(salesman.share)} share, and ${utils.formatPercent(salesman.gpPct)} GP margin.`, `${unitText(salesman.units)}, สัดส่วน ${utils.formatPercent(salesman.share)} และ GP margin ${utils.formatPercent(salesman.gpPct)}`),
        action: kpi.gpPct < 9 ? local("Coach discount control and route high-GP leads to stronger closers.", "โค้ชการควบคุมส่วนลดและส่ง lead GP สูงให้ผู้ปิดการขายที่แข็งแรง") : local("Turn the top performer's activity pattern into a coaching playbook.", "แปลงรูปแบบกิจกรรมของผู้ทำผลงานสูงสุดเป็น playbook การโค้ช"),
        risk: marginSignal
      },
      sales: {
        headline: local(`${monthly[0]?.name || "-"} is the strongest sales month`, `${monthly[0]?.name || "-"} เป็นเดือนขายที่แข็งแรงที่สุด`),
        detail: local(`${dealer.name} leads dealer volume and ${typeMix.name} contributes ${utils.formatPercent(typeMix.share)} of units.`, `${dealer.name} นำจำนวนขาย Dealer และ ${typeMix.name} คิดเป็น ${utils.formatPercent(typeMix.share)} ของจำนวนขาย`),
        action: rows.length < 10 ? local("Filtered sample is small; broaden filters before deciding.", "ตัวอย่างตามตัวกรองยังน้อย ควรขยายตัวกรองก่อนตัดสินใจ") : local("Use channel and payment mix to tune this month's closing plan.", "ใช้สัดส่วนช่องทางและการชำระเงินเพื่อปรับแผนปิดการขายเดือนนี้"),
        risk: marginSignal
      },
      product: {
        headline: local(`${product.name} is the leading product signal`, `${product.name} เป็นสัญญาณสินค้าหลัก`),
        detail: local(`${typeMix.name} represents ${utils.formatPercent(typeMix.share)} of filtered units with ${utils.formatPercent(typeMix.gpPct)} GP margin.`, `${typeMix.name} คิดเป็น ${utils.formatPercent(typeMix.share)} ของจำนวนขายตามตัวกรอง พร้อม GP margin ${utils.formatPercent(typeMix.gpPct)}`),
        action: typeMix.share > 65 ? local("Watch concentration risk and keep substitute models active.", "ติดตามความเสี่ยงการกระจุกตัวและเตรียมรุ่นทดแทน") : local("Use top model demand to open adjacent product conversations.", "ใช้ความต้องการรุ่นหลักเพื่อเปิดโอกาสขายสินค้าที่เกี่ยวข้อง"),
        risk: typeMix.share > 65 ? local("Concentration risk", "เสี่ยงกระจุกตัว") : local("Healthy mix", "สัดส่วนสุขภาพดี")
      },
      dealer: {
        headline: local(`${dealer.name} is strongest by current unit volume`, `${dealer.name} แข็งแรงที่สุดตามจำนวนขายปัจจุบัน`),
        detail: local(`${weakestDealer.name} has the lowest filtered contribution and should be reviewed for activity or stock constraints.`, `${weakestDealer.name} มีสัดส่วนต่ำสุดตามตัวกรอง ควรทบทวนกิจกรรมหรือข้อจำกัดด้านสต็อก`),
        action: dealer.share > 60 ? local("Reduce dependency by lifting secondary dealer activity.", "ลดการพึ่งพาโดยเพิ่มกิจกรรม Dealer รอง") : local("Keep dealer scorecards under weekly review.", "ทบทวน scorecard Dealer ทุกสัปดาห์"),
        risk: dealer.share > 60 ? local("Dealer dependency", "พึ่งพา Dealer สูง") : local("Balanced network", "เครือข่ายสมดุล")
      },
      forecast: {
        headline: local(`${forecast.toLocaleString()} unit rule-based forecast`, `คาดการณ์ตามกฎ ${unitText(forecast)}`),
        detail: local(`${monthly[0]?.name || "-"} is the strongest historical month in the current filter set.`, `${monthly[0]?.name || "-"} เป็นเดือนประวัติที่แข็งแรงที่สุดในตัวกรองปัจจุบัน`),
        action: forecast < 400 ? local("Close the target gap through priority dealer and salesman follow-up.", "ปิดส่วนต่างเป้าหมายผ่านการติดตาม Dealer และพนักงานขายสำคัญ") : local("Forecast is above baseline target; protect margin quality.", "คาดการณ์สูงกว่าเป้าหมาย baseline ให้ปกป้องคุณภาพกำไร"),
        risk: forecast < 400 ? local("Target gap", "มีส่วนต่างเป้าหมาย") : local("On track", "ตามแผน")
      }
    };

    return library[type] || library.executive;
  }

  function executiveSummary(rows) {
    if (!rows.length) {
      return {
        overall: t("message.noRecordsInsight"),
        leadingDealer: local("Dealer leadership cannot be calculated for the current filter.", "ยังคำนวณ Dealer ผู้นำจากตัวกรองปัจจุบันไม่ได้"),
        leadingProduct: local("Product leadership cannot be calculated for the current filter.", "ยังคำนวณสินค้าผู้นำจากตัวกรองปัจจุบันไม่ได้"),
        margin: local("GP margin signal is unavailable because the filtered sales value is zero.", "ยังไม่มีสัญญาณ GP margin เพราะมูลค่ายอดขายตามตัวกรองเป็นศูนย์"),
        forecastRisk: local("Forecast risk is pending until filtered records are available.", "ความเสี่ยงคาดการณ์จะพร้อมเมื่อมีข้อมูลตามตัวกรอง"),
        nextAction: t("message.broadenFiltersDecision"),
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
    const marginSignal = kpi.gpPct < 8 ? local("margin pressure", "แรงกดดันกำไร") : kpi.gpPct < 11 ? local("margin watch", "ต้องติดตามกำไร") : local("stable margin", "กำไรมั่นคง");
    const riskSignal = gap < 0 ? local("forecast shortfall", "คาดการณ์ต่ำกว่าเป้า") : local("forecast on track", "คาดการณ์ตามแผน");
    const nextAction = kpi.gpPct < 8
      ? local(`Protect margin before adding volume pressure, starting with ${lowMarginProduct.name}.`, `ปกป้องกำไรก่อนเร่งจำนวนขาย โดยเริ่มที่ ${lowMarginProduct.name}`)
      : gap < 0
        ? local(`Close the ${Math.abs(gap).toLocaleString()} unit forecast gap through high-probability dealer follow-up.`, `ปิดส่วนต่างคาดการณ์ ${unitText(Math.abs(gap))} ผ่านการติดตาม Dealer ที่มีโอกาสสูง`)
        : local(`Maintain weekly close rhythm and secure availability for ${product.name}.`, `รักษาจังหวะปิดรายสัปดาห์และยืนยันความพร้อมของ ${product.name}`);

    return {
      overall: local(`${kpi.units.toLocaleString()} units delivered with ${utils.formatMoney(kpi.sales)} sales value in the current filter.`, `ส่งมอบ ${unitText(kpi.units)} พร้อมมูลค่ายอดขาย ${utils.formatMoney(kpi.sales)} ในตัวกรองปัจจุบัน`),
      leadingDealer: local(`${dealer.name} is the leading dealer with ${dealer.units.toLocaleString()} units and ${utils.formatPercent(dealer.share)} share.`, `${dealer.name} เป็น Dealer ผู้นำด้วย ${unitText(dealer.units)} และสัดส่วน ${utils.formatPercent(dealer.share)}`),
      leadingProduct: local(`${product.name} is the leading product with ${product.units.toLocaleString()} units and ${utils.formatPercent(product.share)} share.`, `${product.name} เป็นสินค้าผู้นำด้วย ${unitText(product.units)} และสัดส่วน ${utils.formatPercent(product.share)}`),
      margin: local(`${utils.formatPercent(kpi.gpPct)} GP margin indicates ${marginSignal}. Lowest model pressure: ${lowMarginProduct.name} at ${utils.formatPercent(lowMarginProduct.gpPct)}.`, `GP margin ${utils.formatPercent(kpi.gpPct)} แสดงสัญญาณ ${marginSignal} โดยรุ่นที่กดดันต่ำสุดคือ ${lowMarginProduct.name} ที่ ${utils.formatPercent(lowMarginProduct.gpPct)}`),
      forecastRisk: local(`${forecast.toLocaleString()} unit rule-based forecast versus ${target.toLocaleString()} baseline target shows ${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units: ${riskSignal}.`, `คาดการณ์ตามกฎ ${unitText(forecast)} เทียบเป้าหมาย baseline ${unitText(target)} แสดงส่วนต่าง ${gap >= 0 ? "+" : ""}${unitText(gap)}: ${riskSignal}`),
      nextAction,
      forecast,
      target,
      gap
    };
  }

  function detectCopilotIntent(question) {
    const text = String(question || "").toLowerCase();
    if (/(dealer|branch|network|attention|watch|weak|risk dealer|สาขา|ดีลเลอร์|ตัวแทน|เครือข่าย|ต้องติดตาม|ความเสี่ยง dealer)/.test(text)) return "dealer";
    if (/(product|model|push|portfolio|mix|gp model|margin model|สินค้า|รุ่น|ผลักดัน|สัดส่วน|พอร์ต|gp)/.test(text)) return "product";
    if (/(forecast|target|gap|risk|projection|next period|คาดการณ์|เป้าหมาย|ส่วนต่าง|ความเสี่ยง|เดือนหน้า)/.test(text)) return "forecast";
    if (/(action|recommend|next best|priority|do next|decision|ทำอะไร|คำแนะนำ|ถัดไป|ควรทำ|ลำดับความสำคัญ|ตัดสินใจ)/.test(text)) return "action";
    if (/(sales|performance|revenue|kpi|current|unit|gp|margin|ยอดขาย|ผลงาน|รายได้|จำนวนขาย|กำไร)/.test(text)) return "sales";
    return "summary";
  }

  function copilotPlaceholder(question, rows) {
    return {
      intent: detectCopilotIntent(question),
      question: String(question || "").trim(),
      headline: local("Copilot answer pending filtered data", "คำตอบ Copilot รอข้อมูลตามตัวกรอง"),
      meta: t("message.noDataCurrent"),
      cards: [
        {
          type: "kpi",
          label: t("ai.kpiSummary"),
          title: t("message.noDataCurrent"),
          text: local("The copilot cannot calculate sales units, value, or GP margin until the current filters return records.", "Copilot ยังไม่สามารถคำนวณจำนวนขาย มูลค่า หรือ GP margin ได้จนกว่าตัวกรองปัจจุบันจะมีข้อมูล")
        },
        {
          type: "dealer",
          label: t("ai.dealerInsight"),
          title: local("Dealer signal unavailable", "ยังไม่มีสัญญาณ Dealer"),
          text: local("Dealer leadership and attention signals will appear when filtered dealer records are available.", "สัญญาณ Dealer ผู้นำและ Dealer ที่ควรติดตามจะแสดงเมื่อมีข้อมูล Dealer ตามตัวกรอง")
        },
        {
          type: "product",
          label: t("ai.productInsight"),
          title: local("Product signal unavailable", "ยังไม่มีสัญญาณสินค้า"),
          text: local("Product push guidance needs filtered model and product type records.", "คำแนะนำรุ่นที่ควรผลักดันต้องใช้ข้อมูลรุ่นและประเภทสินค้าตามตัวกรอง")
        },
        {
          type: "forecast",
          label: t("ai.forecastInsight"),
          title: t("ai.forecastRisk"),
          text: local("The rule-based forecast placeholder will update after sales records are available.", "คาดการณ์ตามกฎจะอัปเดตหลังจากมีข้อมูลยอดขาย")
        },
        {
          type: "action",
          label: t("ai.recommendedAction"),
          title: local("Reset or broaden filters", "ล้างหรือขยายตัวกรอง"),
          text: rows && rows.length === 0 ? local("Use broader filters before making an executive decision.", "ใช้ตัวกรองที่กว้างขึ้นก่อนตัดสินใจระดับผู้บริหาร") : local("Load dashboard_data.json to activate local copilot answers.", "โหลด dashboard_data.json เพื่อเปิดใช้คำตอบ Copilot ภายใน")
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
    const dealerRisk = topDealer.share > 45 ? local("High concentration", "กระจุกตัวสูง") : weakDealer.units <= 1 ? local("Low activity pocket", "มีกลุ่มกิจกรรมต่ำ") : local("Balanced watch", "ติดตามแบบสมดุล");
    const marginRisk = kpi.gpPct < 8 ? local("margin pressure", "แรงกดดันกำไร") : kpi.gpPct < 11 ? local("margin watch", "ต้องติดตามกำไร") : local("healthy margin", "กำไรสุขภาพดี");
    const forecastRisk = gap < 0 ? local("target gap", "มีส่วนต่างเป้าหมาย") : local("on track", "ตามแผน");
    const productPush = highGpProduct.name !== "-" ? highGpProduct : topProduct;
    const nextAction = copilotAction(intent, { gap, kpi, weakDealer, topDealer, topProduct, productPush, lowGpProduct, topSalesman });
    const headlineMap = {
      sales: local(`Sales performance: ${kpi.units.toLocaleString()} units and ${utils.formatMoney(kpi.sales)} sales value`, `ผลงานยอดขาย: ${unitText(kpi.units)} และมูลค่ายอดขาย ${utils.formatMoney(kpi.sales)}`),
      dealer: local(`Dealer attention: review ${weakDealer.name} while managing ${topDealer.name} concentration`, `Dealer ที่ต้องติดตาม: ทบทวน ${weakDealer.name} พร้อมจัดการการกระจุกตัวของ ${topDealer.name}`),
      product: local(`Product push: prioritize ${productPush.name} with ${utils.formatPercent(productPush.gpPct)} GP margin`, `สินค้าที่ควรผลักดัน: ให้ความสำคัญกับ ${productPush.name} ที่ GP margin ${utils.formatPercent(productPush.gpPct)}`),
      forecast: local(`Forecast risk: ${forecast.toLocaleString()} units versus ${target.toLocaleString()} target`, `ความเสี่ยงคาดการณ์: ${unitText(forecast)} เทียบเป้าหมาย ${unitText(target)}`),
      action: `${t("ai.nextBestAction")}: ${nextAction}`,
      summary: local("Executive copilot summary from current filters", "สรุป Copilot ผู้บริหารจากตัวกรองปัจจุบัน")
    };

    return {
      intent,
      question: prompt,
      headline: headlineMap[intent] || headlineMap.summary,
      meta: local(`Generated from ${data.length.toLocaleString()} filtered local records. Intent: ${intent}.`, `สร้างจากข้อมูลภายใน ${data.length.toLocaleString()} รายการตามตัวกรอง เจตนาคำถาม: ${intent}`),
      cards: [
        {
          type: "kpi",
          label: t("ai.kpiSummary"),
          title: local(`${kpi.units.toLocaleString()} units | ${utils.formatMoney(kpi.sales)} sales`, `${unitText(kpi.units)} | ยอดขาย ${utils.formatMoney(kpi.sales)}`),
          text: local(`Gross profit is ${utils.formatMoney(kpi.gp)} and GP margin is ${utils.formatPercent(kpi.gpPct)}, indicating ${marginRisk}.`, `กำไรขั้นต้น ${utils.formatMoney(kpi.gp)} และ GP margin ${utils.formatPercent(kpi.gpPct)} แสดงสัญญาณ ${marginRisk}`)
        },
        {
          type: "dealer",
          label: t("ai.dealerInsight"),
          title: local(`${weakDealer.name} needs attention`, `${weakDealer.name} ต้องติดตาม`),
          text: local(`${topDealer.name} leads with ${topDealer.units.toLocaleString()} units and ${utils.formatPercent(topDealer.share)} share. ${weakDealer.name} is lowest in the current filter; dealer risk signal is ${dealerRisk}.`, `${topDealer.name} นำด้วย ${unitText(topDealer.units)} และสัดส่วน ${utils.formatPercent(topDealer.share)} โดย ${weakDealer.name} ต่ำสุดในตัวกรองปัจจุบัน สัญญาณความเสี่ยง Dealer คือ ${dealerRisk}`)
        },
        {
          type: "product",
          label: t("ai.productInsight"),
          title: local(`${productPush.name} is the push candidate`, `${productPush.name} เป็นรุ่นที่ควรผลักดัน`),
          text: local(`${topProduct.name} leads volume with ${topProduct.units.toLocaleString()} units. ${topType.name} leads product type mix, while ${lowGpProduct.name} should be watched for GP quality.`, `${topProduct.name} นำจำนวนขายด้วย ${unitText(topProduct.units)} และ ${topType.name} นำสัดส่วนประเภทสินค้า ขณะที่ ${lowGpProduct.name} ควรติดตามคุณภาพ GP`)
        },
        {
          type: "forecast",
          label: t("ai.forecastInsight"),
          title: local(`${gap >= 0 ? "+" : ""}${gap.toLocaleString()} unit forecast gap`, `ส่วนต่างคาดการณ์ ${gap >= 0 ? "+" : ""}${unitText(gap)}`),
          text: local(`Rule-based forecast is ${forecast.toLocaleString()} units against ${target.toLocaleString()} baseline target, showing ${forecastRisk}.`, `คาดการณ์ตามกฎ ${unitText(forecast)} เทียบเป้าหมาย baseline ${unitText(target)} แสดงสัญญาณ ${forecastRisk}`)
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
    if (intent === "dealer") return local(`Lift activity and stock visibility for ${context.weakDealer.name}, while reducing over-reliance on ${context.topDealer.name}.`, `เพิ่มกิจกรรมและความชัดเจนด้านสต็อกของ ${context.weakDealer.name} พร้อมลดการพึ่งพา ${context.topDealer.name}`);
    if (intent === "product") return local(`Push ${context.productPush.name} first, then review margin pressure on ${context.lowGpProduct.name}.`, `ผลักดัน ${context.productPush.name} ก่อน แล้วทบทวนแรงกดดันกำไรของ ${context.lowGpProduct.name}`);
    if (intent === "forecast") {
      return context.gap < 0
        ? local(`Recover ${Math.abs(context.gap).toLocaleString()} units through high-probability dealer and salesman follow-up.`, `กู้คืน ${unitText(Math.abs(context.gap))} ผ่านการติดตาม Dealer และพนักงานขายที่มีโอกาสสูง`)
        : local("Protect GP quality while keeping the close rhythm ahead of the baseline target.", "ปกป้องคุณภาพ GP พร้อมรักษาจังหวะปิดการขายให้เหนือ baseline");
    }
    if (intent === "sales") return local(`Use ${context.topDealer.name}, ${context.topProduct.name}, and ${context.topSalesman.name} as the performance benchmark for the next review.`, `ใช้ ${context.topDealer.name}, ${context.topProduct.name} และ ${context.topSalesman.name} เป็น benchmark ผลงานในการรีวิวครั้งถัดไป`);
    return context.gap < 0
      ? local(`Close the forecast gap first, starting with ${context.weakDealer.name} follow-up and ${context.topProduct.name} deal conversion.`, `ปิดส่วนต่างคาดการณ์ก่อน โดยเริ่มจากการติดตาม ${context.weakDealer.name} และ conversion ของ ${context.topProduct.name}`)
      : local(`Maintain weekly close discipline and keep ${context.productPush.name} available across priority dealers.`, `รักษาวินัยปิดการขายรายสัปดาห์และทำให้ ${context.productPush.name} พร้อมสำหรับ Dealer สำคัญ`);
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
        local(`Weekly focus: ${topDealer.name} and ${topProduct.name} should anchor the next close rhythm.`, `โฟกัสรายสัปดาห์: ใช้ ${topDealer.name} และ ${topProduct.name} เป็นแกนหลักของจังหวะปิดการขายถัดไป`),
        local(`Sales execution: ${topSalesman.name} is the leading salesman signal in the active data.`, `การดำเนินงานขาย: ${topSalesman.name} เป็นสัญญาณพนักงานขายหลักในข้อมูลปัจจุบัน`),
        local(`Risk watch: ${summary.gap < 0 ? "recover forecast gap" : "protect margin while ahead of baseline"}.`, `ติดตามความเสี่ยง: ${summary.gap < 0 ? "กู้คืนส่วนต่างคาดการณ์" : "ปกป้องกำไรขณะอยู่เหนือ baseline"}`)
      ],
      monthly: [
        local(`Monthly result: ${kpi.units.toLocaleString()} filtered units and ${utils.formatMoney(kpi.gp)} GP.`, `ผลรายเดือน: ${unitText(kpi.units)} ตามตัวกรอง และ GP ${utils.formatMoney(kpi.gp)}`),
        local(`Portfolio signal: ${topProduct.name} leads product contribution; review substitute offers where concentration rises.`, `สัญญาณพอร์ตสินค้า: ${topProduct.name} นำสัดส่วนสินค้า ให้ทบทวนข้อเสนอรุ่นทดแทนเมื่อเกิดการกระจุกตัว`),
        local("Management rhythm: review dealer, salesman, and margin scorecards before month-end close.", "จังหวะบริหาร: ทบทวน scorecard Dealer พนักงานขาย และกำไรก่อนปิดสิ้นเดือน")
      ],
      executive: [
        summary.overall,
        summary.leadingDealer,
        summary.leadingProduct,
        summary.margin,
        summary.forecastRisk,
        `${t("ai.recommendedAction")}: ${summary.nextAction}`
      ],
      dealer: [
        local(`Dealer leader: ${topDealer.name} with ${topDealer.units.toLocaleString()} units and ${utils.formatPercent(topDealer.gpPct)} GP margin.`, `Dealer ผู้นำ: ${topDealer.name} ด้วย ${unitText(topDealer.units)} และ GP margin ${utils.formatPercent(topDealer.gpPct)}`),
        local(`Dealer to review: ${weakDealer.name} has the lowest filtered contribution.`, `Dealer ที่ควรทบทวน: ${weakDealer.name} มีสัดส่วนต่ำสุดตามตัวกรอง`),
        local(`Network balance: top dealer share is ${utils.formatPercent(topDealer.share)}.`, `สมดุลเครือข่าย: Dealer อันดับหนึ่งมีสัดส่วน ${utils.formatPercent(topDealer.share)}`),
        local(`Recommended next action: lift activity, stock visibility, and weekly follow-up for ${weakDealer.name}.`, `คำแนะนำถัดไป: เพิ่มกิจกรรม ความชัดเจนสต็อก และติดตามรายสัปดาห์สำหรับ ${weakDealer.name}`)
      ]
    };

    return {
      title,
      meta: local(`Generated from ${rows.length.toLocaleString()} filtered local records. ${t("kpi.lastRefresh")} ${utils.lastRefresh()}.`, `สร้างจากข้อมูลภายใน ${rows.length.toLocaleString()} รายการตามตัวกรอง ${t("kpi.lastRefresh")} ${utils.lastRefresh()}`),
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
        <p id="enterpriseExportStatus" class="export-status" data-i18n="export.ready">V10 Export Center prepared.</p>
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
          <h2 data-i18n="ai.ruleBased">V10 Rule-Based Insights</h2>
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
      [local("Metric", "หัวข้อ"), local("Value", "ค่า")],
      [t("label.filteredUnits"), kpi.units],
      [t("kpi.salesValue"), kpi.sales],
      [t("kpi.grossProfit"), kpi.gp],
      [t("kpi.gpMargin"), utils.formatPercent(kpi.gpPct)],
      [t("kpi.forecast"), summary.forecast],
      [t("label.targetBaseline"), summary.target],
      [t("kpi.forecastGap"), summary.gap],
      [local("Overall sales result", "ภาพรวมยอดขาย"), summary.overall],
      [local("Leading dealer", "Dealer ผู้นำ"), summary.leadingDealer],
      [local("Leading product", "สินค้าผู้นำ"), summary.leadingProduct],
      [local("GP margin signal", "สัญญาณ GP margin"), summary.margin],
      [local("Forecast risk", "ความเสี่ยงคาดการณ์"), summary.forecastRisk],
      [t("ai.recommendedAction"), summary.nextAction]
    ];
    downloadFile("kmm-v10-executive-summary.csv", "text/csv;charset=utf-8", "\uFEFF" + table.map((row) => row.map(csvCell).join(",")).join("\n"));
  }

  async function exportPng() {
    const target = document.querySelector(".main-content");
    if (!target) throw new Error(t("error.dashboardUnavailable"));

    const clone = target.cloneNode(true);
    clone.querySelectorAll("canvas").forEach((canvasClone, index) => {
      const sourceCanvas = target.querySelectorAll("canvas")[index];
      const image = new Image();
      image.alt = local("Rendered chart", "กราฟที่แสดงผลแล้ว");
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
        downloadFile("kmm-v10-dashboard.png", "image/png", blob);
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
          <div class="enterprise-eyebrow" data-i18n="report.production">V10 Production Report</div>
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
        <span>${insight.risk || t("ai.localInsight")}</span>
        <strong>${insight.headline || t("ai.insightReady")}</strong>
        <p>${insight.detail || t("ai.rulePrepared")}</p>
        <small>${insight.action || t("ai.noExternalApi")}</small>
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
    deck.setAttribute("aria-label", "V10 Enterprise Intelligence");
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

  function actionCard(title, text, tag = t("label.nextBestAction")) {
    return `<article class="intel-action-card"><span>${tag}</span><strong>${title}</strong><p>${text}</p></article>`;
  }

  function placeholderCard(title, value, text) {
    return `<article class="intel-placeholder-card"><span>${local("V10 foundation", "พื้นฐาน V10")}</span><strong>${title}</strong><b>${value}</b><p>${text}</p></article>`;
  }

  function renderCommonKpiWall(summary, groups) {
    const topDealer = safeTop(groups.dealers);
    const topModel = safeTop(groups.models);
    const forecast = Math.round(summary.units * 1.08);
    return `
      <div class="enterprise-kpi-wall">
        ${valueCard(t("label.filteredUnits"), summary.units.toLocaleString(), "dashboard_data.json")}
        ${valueCard(t("kpi.salesValue"), utils.formatMoney(summary.sales), t("label.currentFilter"))}
        ${valueCard(t("kpi.gpMargin"), utils.formatPercent(summary.gpPct), summary.gpPct < 8 ? local("Margin pressure", "แรงกดดันกำไร") : local("Margin stable", "กำไรมั่นคง"))}
        ${valueCard(t("kpi.bestDealer"), topDealer.name, local(`${utils.formatPercent(topDealer.share)} unit share`, `สัดส่วนจำนวนขาย ${utils.formatPercent(topDealer.share)}`))}
        ${valueCard(t("kpi.topModel"), topModel.name, unitText(topModel.units))}
        ${valueCard(t("kpi.ruleForecast"), forecast.toLocaleString(), t("label.staticForecastPlaceholder"))}
      </div>`;
  }

  function pageGroups(rows) {
    return {
      dealers: utils.groupBy(rows, (item) => item.dealer),
      salesmen: utils.groupBy(rows, utils.salesmanName),
      models: utils.groupBy(rows, (item) => item.model),
      types: utils.groupBy(rows, (item) => item.type),
      sources: utils.groupBy(rows, utils.sourceName),
      months: utils.groupBy(rows, (item) => monthName(item.month)).reverse()
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
        <section class="intel-panel wide"><div class="enterprise-eyebrow">${t("label.executiveSummaryPanel")}</div><h2>${local(`${summary.units.toLocaleString()} units with ${utils.formatPercent(summary.gpPct)} GP margin`, `${unitText(summary.units)} พร้อม GP margin ${utils.formatPercent(summary.gpPct)}`)}</h2><p>${local(`${topDealer.name} leads dealer contribution while ${topModel.name} anchors product demand. The rule-based forecast shows ${gap >= 0 ? "an upside" : "a shortfall"} of ${gap >= 0 ? "+" : ""}${gap.toLocaleString()} units against placeholder target.`, `${topDealer.name} นำสัดส่วน Dealer ขณะที่ ${topModel.name} เป็นแกนความต้องการสินค้า คาดการณ์ตามกฎแสดง${gap >= 0 ? "ส่วนเพิ่ม" : "ส่วนขาด"} ${gap >= 0 ? "+" : ""}${unitText(gap)} เทียบเป้าหมาย placeholder`)}</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.alertCenter")}</div>${alertCard(summary.gpPct < 8 ? local("High", "สูง") : local("Watch", "ติดตาม"), local("Margin Quality", "คุณภาพกำไร"), local(`${utils.formatPercent(summary.gpPct)} GP margin in the active filter.`, `GP margin ${utils.formatPercent(summary.gpPct)} ในตัวกรองปัจจุบัน`))}${alertCard(topDealer.share > 45 ? local("High", "สูง") : local("Review", "ทบทวน"), local("Dealer Dependency", "การพึ่งพา Dealer"), local(`${topDealer.name} contributes ${utils.formatPercent(topDealer.share)} of units.`, `${topDealer.name} คิดเป็น ${utils.formatPercent(topDealer.share)} ของจำนวนขาย`))}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.top5Risks")}</div>${[lowMargin, weakDealer, topDealer, topModel, safeTop(groups.types)].map((row, index) => miniRow(`${index + 1}. ${row.name}`, index === 0 ? local("Margin", "กำไร") : unitText(row.units), local(`Share ${utils.formatPercent(row.share || 0)}`, `สัดส่วน ${utils.formatPercent(row.share || 0)}`))).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.nextBestActions")}</div>${actionCard(local("Protect margin", "ปกป้องกำไร"), local(`Review discounting on ${lowMargin.name}.`, `ทบทวนส่วนลดของ ${lowMargin.name}`))}${actionCard(local("Lift secondary dealers", "ยกระดับ Dealer รอง"), local(`Follow up with ${weakDealer.name} on activity and stock blockers.`, `ติดตาม ${weakDealer.name} เรื่องกิจกรรมและข้อจำกัดสต็อก`))}${actionCard(local("Secure availability", "ยืนยันความพร้อมสินค้า"), local(`Keep ${topModel.name} supply visible for close planning.`, `ทำให้ supply ของ ${topModel.name} ชัดเจนสำหรับแผนปิดการขาย`))}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.dealerSnapshot")}</div>${groups.dealers.slice(0, 5).map((row) => miniRow(row.name, unitText(row.units), `GP ${utils.formatPercent(row.gpPct)}`)).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.productSnapshot")}</div>${groups.types.slice(0, 5).map((row) => miniRow(row.name, local(`${utils.formatPercent(row.share)} mix`, `สัดส่วน ${utils.formatPercent(row.share)}`), unitText(row.units))).join("")}</section>
        <section class="intel-panel">${placeholderCard(t("label.monthlyGapForecast"), `${gap >= 0 ? "+" : ""}${unitText(gap)}`, local("V10 static forecast center with target, actual, gap, and confidence controls.", "ศูนย์คาดการณ์ Static V10 พร้อมเป้าหมาย ยอดจริง ส่วนต่าง และความเชื่อมั่น"))}</section>
      </div>`;
  }

  function renderSalesDeck(summary, groups) {
    const bestMonth = safeTop(groups.months.slice().sort((a, b) => b.units - a.units));
    const source = safeTop(groups.sources);
    const model = safeTop(groups.models);
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.salesFunnelPlaceholder")}</div>${placeholderCard(local("Lead to Delivery", "Lead ถึงส่งมอบ"), local(`${Math.round(summary.units * 1.6).toLocaleString()} bookings`, `ยอดจองประมาณ ${Math.round(summary.units * 1.6).toLocaleString()}`), local("Booking and landing snapshot is prepared when those fields are available in the source data.", "ภาพรวม booking และ landing พร้อมใช้งานเมื่อข้อมูลต้นทางมีฟิลด์เหล่านี้"))}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.salesTrendComparison")}</div>${groups.months.slice(-5).map((row) => miniRow(row.name, unitText(row.units), local(`Target ${Math.round(row.units * 1.15).toLocaleString()}`, `เป้าหมาย ${Math.round(row.units * 1.15).toLocaleString()}`))).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.salesSourceAnalysis")}</div>${groups.sources.slice(0, 5).map((row) => miniRow(row.name, unitText(row.units), local(`${utils.formatPercent(row.share)} share`, `สัดส่วน ${utils.formatPercent(row.share)}`))).join("")}</section>
        <section class="intel-panel wide"><div class="enterprise-eyebrow">${t("label.aiSalesInsightPanel")}</div><h2>${local(`${bestMonth.name} is the strongest sales period`, `${bestMonth.name} เป็นช่วงขายที่แข็งแรงที่สุด`)}</h2><p>${local(`${source.name} is the leading source and ${model.name} should anchor the close plan. Current GP margin is ${utils.formatPercent(summary.gpPct)}.`, `${source.name} เป็นแหล่งลูกค้าหลัก และ ${model.name} ควรเป็นแกนแผนปิดการขาย GP margin ปัจจุบันคือ ${utils.formatPercent(summary.gpPct)}`)}</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.actionRecommendationCards")}</div>${actionCard(local("Push high-probability leads", "ผลักดัน lead โอกาสสูง"), local(`Prioritize ${source.name} leads with ${model.name} offers.`, `ให้ความสำคัญกับ lead จาก ${source.name} พร้อมข้อเสนอ ${model.name}`))}${actionCard(local("Protect payment quality", "ปกป้องคุณภาพการชำระเงิน"), local("Review payment mix before accelerating volume.", "ทบทวนสัดส่วนการชำระเงินก่อนเร่งจำนวนขาย"))}${actionCard(local("Use monthly rhythm", "ใช้จังหวะรายเดือน"), local(`Replicate ${bestMonth.name} activity cadence.`, `ทำซ้ำจังหวะกิจกรรมของ ${bestMonth.name}`))}</section>
      </div>`;
  }

  function renderSalesmanDeck(summary, groups) {
    const leader = safeTop(groups.salesmen);
    const coach = groups.salesmen.slice().sort((a, b) => a.gpPct - b.gpPct)[0] || leader;
    const source = safeTop(groups.sources);
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel wide"><div class="enterprise-eyebrow">${t("label.coachingInsightPanel")}</div><h2>${local(`${leader.name} leads the team`, `${leader.name} นำทีม`)}</h2><p>${local(`${coach.name} is the coaching focus for margin or conversion. Route best ${source.name} leads through proven playbooks and track follow-up quality weekly.`, `${coach.name} เป็นจุดโฟกัสการโค้ชด้านกำไรหรือ conversion ให้ส่ง lead ${source.name} ที่ดีที่สุดผ่าน playbook ที่พิสูจน์แล้ว และติดตามคุณภาพ follow-up รายสัปดาห์`)}</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.salesmanRanking")}</div>${groups.salesmen.slice(0, 5).map((row, index) => miniRow(`${index + 1}. ${row.name}`, unitText(row.units), `GP ${utils.formatPercent(row.gpPct)}`)).join("")}</section>
        <section class="intel-panel">${placeholderCard(t("label.performanceMatrix"), "Volume x GP", local("Matrix is prepared for quadrant scoring, coaching paths, and achievement targets.", "เมทริกซ์พร้อมสำหรับ scoring แบบ quadrant เส้นทางโค้ช และเป้าหมาย achievement"))}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.productSpecialization")}</div>${groups.types.slice(0, 4).map((row) => miniRow(row.name, unitText(row.units), local(`${utils.formatPercent(row.share)} mix`, `สัดส่วน ${utils.formatPercent(row.share)}`))).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.leadSourceInsight")}</div>${groups.sources.slice(0, 4).map((row) => miniRow(row.name, local(`${row.units.toLocaleString()} leads`, `${row.units.toLocaleString()} lead`), local(`Share ${utils.formatPercent(row.share)}`, `สัดส่วน ${utils.formatPercent(row.share)}`))).join("")}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.actionRecommendationCards")}</div>${actionCard(local("Coach margin control", "โค้ชการควบคุมกำไร"), local(`Review ${coach.name} discount pattern.`, `ทบทวนรูปแบบส่วนลดของ ${coach.name}`))}${actionCard(local("Scale leader behavior", "ขยายพฤติกรรมผู้นำ"), local(`Turn ${leader.name} routines into a team checklist.`, `แปลง routine ของ ${leader.name} เป็น checklist ทีม`))}${actionCard(local("Specialize by product", "เชี่ยวชาญตามสินค้า"), local(`Assign specialists around ${safeTop(groups.types).name}.`, `มอบหมายผู้เชี่ยวชาญสำหรับ ${safeTop(groups.types).name}`))}</section>
      </div>`;
  }

  function renderProductDeck(summary, groups) {
    const topModel = safeTop(groups.models);
    const slow = safeBottom(groups.models);
    const highGp = groups.models.slice().sort((a, b) => b.gpPct - a.gpPct)[0] || topModel;
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel wide"><div class="enterprise-eyebrow">${t("label.modelRankingHighlight")}</div><h2>${local(`${topModel.name} is the lead demand signal`, `${topModel.name} เป็นสัญญาณความต้องการหลัก`)}</h2><p>${local(`${topModel.units.toLocaleString()} units sold with ${utils.formatPercent(topModel.share)} share. ${highGp.name} has the strongest GP quality at ${utils.formatPercent(highGp.gpPct)}.`, `ขายแล้ว ${unitText(topModel.units)} พร้อมสัดส่วน ${utils.formatPercent(topModel.share)} โดย ${highGp.name} มีคุณภาพ GP แข็งแรงที่สุดที่ ${utils.formatPercent(highGp.gpPct)}`)}</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.productMixInsight")}</div>${groups.types.slice(0, 5).map((row) => miniRow(row.name, local(`${utils.formatPercent(row.share)} mix`, `สัดส่วน ${utils.formatPercent(row.share)}`), unitText(row.units))).join("")}</section>
        <section class="intel-panel">${placeholderCard(t("label.slowMovingRisk"), slow.name, local("Prepared for inventory age, slow movement, and dealer stock risk scoring.", "เตรียมไว้สำหรับอายุสต็อก การเคลื่อนไหวช้า และ scoring ความเสี่ยงสต็อก Dealer"))}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${local("Product Recommendation Cards", "การ์ดคำแนะนำสินค้า")}</div>${actionCard(local("Anchor campaigns", "ใช้เป็นแกนแคมเปญ"), local(`Use ${topModel.name} demand in dealer campaigns.`, `ใช้ความต้องการ ${topModel.name} ในแคมเปญ Dealer`))}${actionCard(local("Protect GP", "ปกป้อง GP"), local(`Preserve pricing on ${highGp.name}.`, `รักษาราคาของ ${highGp.name}`))}${actionCard(local("Watch slow movement", "ติดตามรุ่นเคลื่อนไหวช้า"), local(`Review stock and offers for ${slow.name}.`, `ทบทวนสต็อกและข้อเสนอของ ${slow.name}`))}</section>
      </div>`;
  }

  function renderDealerDeck(summary, groups) {
    const dealer = safeTop(groups.dealers);
    const weak = safeBottom(groups.dealers);
    return `
      ${renderCommonKpiWall(summary, groups)}
      <div class="enterprise-intel-grid">
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.dealerRanking")}</div>${groups.dealers.slice(0, 5).map((row, index) => miniRow(`${index + 1}. ${row.name}`, unitText(row.units), local(`${utils.formatPercent(row.share)} share`, `สัดส่วน ${utils.formatPercent(row.share)}`))).join("")}</section>
        <section class="intel-panel">${placeholderCard(t("label.dealerScore"), `${Math.min(99, Math.round((dealer.share || 0) + 62))}/100`, local("Composite score placeholder for sales, stock, collection, service, and coverage.", "คะแนนรวมแบบ placeholder สำหรับยอดขาย สต็อก การเก็บเงิน บริการ และพื้นที่"))}</section>
        <section class="intel-panel wide"><div class="enterprise-eyebrow">${t("label.dealerHealth")}</div><h2>${local(`${dealer.name} leads network performance`, `${dealer.name} นำผลงานเครือข่าย`)}</h2><p>${local(`${weak.name} needs activity review. Dealer concentration is ${utils.formatPercent(dealer.share)}, so secondary dealer lift remains important for resilience.`, `${weak.name} ต้องทบทวนกิจกรรม การกระจุกตัว Dealer อยู่ที่ ${utils.formatPercent(dealer.share)} ดังนั้นการยกระดับ Dealer รองยังสำคัญต่อความยืดหยุ่น`)}</p></section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${local("Dealer Action Cards", "การ์ดการดำเนินการ Dealer")}</div>${actionCard(local("Reduce dependency", "ลดการพึ่งพา"), local(`Lift activity for ${weak.name}.`, `เพิ่มกิจกรรมของ ${weak.name}`))}${actionCard(local("Protect leader", "รักษาผู้นำ"), local(`Keep stock availability visible for ${dealer.name}.`, `ทำให้สต็อกของ ${dealer.name} ชัดเจน`))}${actionCard(local("Weekly scorecard", "Scorecard รายสัปดาห์"), local("Track sales, collection, and stock age together.", "ติดตามยอดขาย การเก็บเงิน และอายุสต็อกร่วมกัน"))}</section>
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
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.forecastVsActual")}</div>${miniRow(t("label.actual"), unitText(summary.units), t("label.filteredRecords"))}${miniRow(t("kpi.forecast"), unitText(forecast), local("Rule-based placeholder", "Placeholder ตามกฎ"))}${miniRow(t("kpi.target"), unitText(target), t("label.staticPlanningBaseline"))}</section>
        <section class="intel-panel"><div class="enterprise-eyebrow">${t("label.gapAnalysis")}</div>${miniRow(t("label.gap"), `${gap >= 0 ? "+" : ""}${unitText(gap)}`, gap < 0 ? local("Needs recovery", "ต้องกู้คืน") : local("Above target", "สูงกว่าเป้าหมาย"))}${miniRow(t("label.valueForecast"), utils.formatMoney(summary.sales * 1.08), t("label.estimated"))}</section>
        <section class="intel-panel wide"><div class="enterprise-eyebrow">${t("label.riskOpportunityInsight")}</div><h2>${gap < 0 ? local("Target gap requires action", "ส่วนต่างเป้าหมายต้องดำเนินการ") : local("Forecast is on track", "คาดการณ์ตามแผน")}</h2><p>${local(`${safeTop(groups.dealers).name} and ${safeTop(groups.salesmen).name} are the strongest levers in the current filter. Use high-probability deals first, then protect GP margin.`, `${safeTop(groups.dealers).name} และ ${safeTop(groups.salesmen).name} เป็นตัวขับเคลื่อนที่แข็งแรงที่สุดในตัวกรองปัจจุบัน ให้ใช้ดีลโอกาสสูงก่อน แล้วปกป้อง GP margin`)}</p></section>
        <section class="intel-panel">${placeholderCard(t("label.forecastConfidence"), `${confidence}%`, local("Prepared for future scenario weighting, pipeline probability, and confidence model controls.", "เตรียมไว้สำหรับการถ่วงน้ำหนัก scenario, probability ของ pipeline และโมเดลความเชื่อมั่น"))}</section>
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
    footer.innerHTML = `<strong>KMM Sales Intelligence V10 Production Release</strong><span>${t("message.footer")}</span>`;
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
