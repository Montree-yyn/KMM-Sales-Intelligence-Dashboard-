(function (window) {
  "use strict";

  const U = window.BI.utils;
  const F = window.BI.filters;
  const C = window.BI.charts;
  const filterIds = ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "salesmanFilter"];

  const TARGETS = {
    sales: 420,
    booking: 520,
    landing: 180,
    collection: 92
  };

  const demo = {
    market: {
      leads: 36,
      qualified: 18,
      campaign: 64,
      ricePrice: "Sample / Demo: ราคาข้าวทรงตัวสูง",
      fuelPrice: "Sample / Demo: น้ำมันกดดันต้นทุน",
      weather: "Sample / Demo: พื้นที่พร้อมลงแปลง",
      competitor: "Sample / Demo: คู่แข่งเร่งโปรโมชัน 2 พื้นที่"
    },
    team: {
      activity: 72,
      visits: 14,
      training: 81
    },
    reports: {
      archive: 12
    }
  };

  const pageConfig = {
    focus: {
      title: "Focus",
      thaiTitle: "โฟกัสวันนี้",
      subtitle: "What should the sales team focus on today?",
      question: "วันนี้ทีมขายต้องโฟกัสอะไร เพื่อเปลี่ยนโอกาสเป็นยอดส่งมอบ",
      kpis: ["deliveryFromBooking", "newDelivery", "newBooking", "advanceBooking", "totalDelivery", "forecastGap"]
    },
    sales: {
      title: "Sales",
      thaiTitle: "ยอดขาย",
      subtitle: "How is sales performance?",
      question: "ยอดขายไปถึงเป้าหมายแค่ไหน และต้องเร่งจุดใดก่อน",
      kpis: ["salesMtd", "salesYtd", "targetAchievement", "forecastGap", "gp", "conversion"]
    },
    market: {
      title: "Market",
      thaiTitle: "โอกาสทางการตลาด",
      subtitle: "Where are the sales opportunities?",
      question: "พื้นที่ไหนมีโอกาสขาย และลูกค้ากลุ่มใดควรเข้าพบก่อน",
      kpis: ["marketOpportunity", "qualifiedLeads", "campaignPerformance", "dealerActivity", "ricePrice", "weather"]
    },
    stock: {
      title: "Stock",
      thaiTitle: "สต็อกพร้อมขาย",
      subtitle: "What products are ready to sell?",
      question: "Model ไหนพร้อมขาย รุ่นไหนต้องเคลียร์ และ Stock พอรองรับดีลหรือไม่",
      kpis: ["currentStock", "readyToSell", "landing", "eta", "stockAging", "backOrder"]
    },
    team: {
      title: "Team",
      thaiTitle: "ทีมขาย",
      subtitle: "How is the sales team performing?",
      question: "ใครทำผลงานดี ใครต้องช่วย และกิจกรรมขายพอปิดเป้าหรือไม่",
      kpis: ["teamSales", "topPerformer", "atRiskSalesperson", "activityTracking", "visitPlan", "trainingStatus"]
    },
    reports: {
      title: "Reports",
      thaiTitle: "รายงาน",
      subtitle: "What reports should be exported or reviewed?",
      question: "รายงานใดต้องส่งหรือทบทวน และข้อมูลพร้อม export แค่ไหน",
      kpis: ["dailyReport", "weeklyReport", "monthlyReport", "kpiReport", "exportReady", "reportArchive"]
    }
  };

  document.addEventListener("DOMContentLoaded", async () => {
    markActiveMenu();
    await U.loadDashboardData();
    F.fillFilters(U.getCoreProductData(), {
      yearLabel: "ทุกปี",
      monthLabel: "ทุกเดือน",
      weekLabel: "ทุกสัปดาห์",
      dealerLabel: "ทุก Dealer / Branch",
      salesmanLabel: "ทุก Salesperson"
    });
    F.bindFilters(render, filterIds);
    render();
  });

  function currentPage() {
    return document.body.dataset.v13Page || "focus";
  }

  function render() {
    const page = currentPage();
    const data = F.applyFilters(U.getCoreProductData());
    const ctx = buildContext(data);
    renderHeader(page, ctx);
    renderKpis(page, ctx);
    renderPage(page, ctx);
  }

  function buildContext(data) {
    const summary = U.kpi(data);
    const dealers = U.groupBy(data, (item) => item.dealer);
    const models = U.groupBy(data, (item) => item.model);
    const types = U.groupBy(data, (item) => item.type);
    const regions = U.groupBy(data, (item) => item.region);
    const branches = U.groupBy(data, (item) => item.branch || item.dealer || "Unknown");
    const salesmen = U.groupBy(data, U.salesmanName);
    const months = U.groupBy(data, (item) => U.monthName(item.month)).reverse();
    const forecast = Math.round(summary.units * 1.16 + average(months.map((row) => row.units)) * 2);
    const booking = Math.round(summary.units * 1.28);
    const deliveryFromBooking = Math.round(summary.units * 0.62);
    const stockRows = buildStock(models, dealers);
    const landing = Math.round(stockRows.reduce((sum, row) => sum + row.stock, 0) * 0.28);
    return {
      data,
      summary,
      dealers,
      models,
      types,
      regions,
      branches,
      salesmen,
      months,
      forecast,
      forecastGap: Math.max(TARGETS.sales - forecast, 0),
      booking,
      deliveryFromBooking,
      newDelivery: Math.max(0, summary.units - deliveryFromBooking),
      advanceBooking: Math.round(booking * 0.34),
      collectionRate: Math.min(98, Math.round(84 + summary.gpPct / 2)),
      landing,
      stockRows,
      readyStock: stockRows.reduce((sum, row) => sum + row.ready, 0),
      currentStock: stockRows.reduce((sum, row) => sum + row.stock, 0),
      updated: U.lastRefresh()
    };
  }

  function buildStock(models, dealers) {
    return models.slice(0, 12).map((model, index) => {
      const stock = Math.max(4, Math.round(model.units * (index % 4 === 0 ? 0.9 : 0.55)) + 6);
      const ready = Math.round(stock * (index % 5 === 0 ? 0.52 : 0.74));
      return {
        name: model.name,
        dealer: dealers[index % Math.max(dealers.length, 1)]?.name || "KMM",
        stock,
        ready,
        landing: Math.max(1, Math.round(stock * 0.28)),
        backOrder: index % 4 === 0 ? 2 + index : index % 3,
        aging: 18 + (index * 13) % 120,
        speed: index < 4 ? "Fast Moving" : index > 8 ? "Slow Moving" : "Normal",
        value: stock * (model.sales / Math.max(model.units, 1))
      };
    });
  }

  function renderHeader(page, ctx) {
    const config = pageConfig[page];
    set("pageTitle", config.title);
    set("pageThaiTitle", config.thaiTitle);
    set("pageSubtitle", config.subtitle);
    set("businessQuestion", config.question);
    set("lastUpdated", ctx.updated);
  }

  function renderKpis(page, ctx) {
    html("v13Kpis", pageConfig[page].kpis.map((key) => kpiCard(kpiValue(key, ctx))).join(""));
  }

  function kpiValue(key, ctx) {
    const s = ctx.summary;
    const topDealer = ctx.dealers[0]?.name || "-";
    const topModel = ctx.models[0]?.name || "-";
    const topSalesman = ctx.salesmen[0]?.name || "-";
    const atRisk = ctx.salesmen.at(-1)?.name || "-";
    const values = {
      deliveryFromBooking: ["Delivery from Booking", fmt(ctx.deliveryFromBooking), "Focus 1 | ส่งมอบจาก Booking"],
      newDelivery: ["New Delivery", fmt(ctx.newDelivery), "Focus 2 | ดีลส่งมอบใหม่"],
      newBooking: ["New Booking", fmt(ctx.booking), `${pct(ctx.booking, TARGETS.booking)}% ของเป้า Booking`],
      advanceBooking: ["Advance Booking", fmt(ctx.advanceBooking), "Focus 4 | เติม Pipeline เดือนถัดไป"],
      totalDelivery: ["Total Delivery", fmt(s.units), `${pct(s.units, TARGETS.sales)}% ของเป้าส่งมอบ`],
      forecastGap: ["Forecast Gap", fmt(Math.max(TARGETS.sales - ctx.forecast, 0)), "ยอดที่ยังขาดจากเป้าหมาย"],
      salesMtd: ["Sales MTD", fmt(s.units), "ยอดขายตาม Filter ปัจจุบัน"],
      salesYtd: ["Sales YTD", money(s.sales), `${fmt(s.units)} units`],
      targetAchievement: ["Target Achievement", `${pct(s.units, TARGETS.sales)}%`, `${fmt(TARGETS.sales)} units target`],
      gp: ["GP / GP%", `${money(s.gp)} / ${U.formatPercent(s.gpPct)}`, "คุณภาพกำไร"],
      conversion: ["Booking to Delivery", `${pct(s.units, ctx.booking)}%`, "อัตราเปลี่ยน Booking เป็น Delivery"],
      marketOpportunity: ["Market Opportunity", demo.market.leads, "Sample / Demo leads"],
      qualifiedLeads: ["Qualified Leads", demo.market.qualified, "Sample / Demo"],
      campaignPerformance: ["Campaign Performance", `${demo.market.campaign}%`, "Sample / Demo"],
      dealerActivity: ["Dealer Activity", topDealer, "Dealer ที่เคลื่อนไหวสูงสุด"],
      ricePrice: ["Rice Price", "Sample", "Sample / Demo signal"],
      weather: ["Weather / Field", "Good", "Sample / Demo"],
      currentStock: ["Current Stock", fmt(ctx.currentStock), "Sample จาก sales mix"],
      readyToSell: ["Ready to Sell", fmt(ctx.readyStock), `${pct(ctx.readyStock, ctx.currentStock)}% พร้อมขาย`],
      landing: ["Landing", fmt(ctx.landing), `${pct(ctx.landing, TARGETS.landing)}% ของเป้า Landing`],
      eta: ["ETA", "7-14 days", "Sample / Demo"],
      stockAging: ["Stock Aging", `${Math.round(average(ctx.stockRows.map((row) => row.aging)))} days`, "อายุสต็อกเฉลี่ย"],
      backOrder: ["Back Order", fmt(ctx.stockRows.reduce((sum, row) => sum + row.backOrder, 0)), "Sample / Demo"],
      teamSales: ["Team Sales", fmt(s.units), topSalesman],
      topPerformer: ["Top Performer", topSalesman, `${fmt(ctx.salesmen[0]?.units || 0)} units`],
      atRiskSalesperson: ["At-risk Salesperson", atRisk, "ต้อง Coaching"],
      activityTracking: ["Activity Tracking", `${demo.team.activity}%`, "Sample / Demo"],
      visitPlan: ["Visit Plan", `${demo.team.visits} visits`, "Sample / Demo"],
      trainingStatus: ["Training Status", `${demo.team.training}%`, "Sample / Demo"],
      dailyReport: ["Daily Report", "Ready", "Focus + Action วันนี้"],
      weeklyReport: ["Weekly Report", "Ready", "Dealer / Model ranking"],
      monthlyReport: ["Monthly Report", "Draft", "รอปิดงวด"],
      kpiReport: ["KPI Report", `${pct(s.units, TARGETS.sales)}%`, "Target review"],
      exportReady: ["Export", "PDF / Excel / PPT", "Static placeholder"],
      reportArchive: ["Report Archive", demo.reports.archive, "Sample / Demo"]
    };
    const row = values[key] || [key, "-", ""];
    return { name: row[0], value: row[1], note: row[2] };
  }

  function renderPage(page, ctx) {
    const renderers = { focus, sales, market, stock, team, reports };
    renderers[page](ctx);
  }

  function focus(ctx) {
    html("mainArea", `
      ${sectionLabel("Main analysis area")}
      <section class="v13-grid">
        ${chartCard("Today Focus", "Priority action stack for daily sales control.", `<div class="v13-focus-stack">
          ${focusCard("Focus 1", "Delivery from Booking", ctx.deliveryFromBooking, "โทรยืนยัน Booking ที่พร้อมส่งมอบ และล็อกวันส่งให้ชัดเจน")}
          ${focusCard("Focus 2", "New Delivery", ctx.newDelivery, "เร่งดีลที่พร้อมรับรถและเอกสารครบ")}
          ${focusCard("Focus 3", "New Booking", ctx.booking, "เปิด Booking ใหม่จาก Dealer และ lead คุณภาพ")}
          ${focusCard("Focus 4", "Advance Booking", ctx.advanceBooking, "เติม Pipeline สำหรับเดือนถัดไป")}
          ${focusCard("Focus 5", "Total Delivery", ctx.summary.units, "คุมยอดส่งมอบรวมเทียบเป้ารายวัน")}
        </div>`, "v13-span-2")}
        ${chartCard("Action Required Today", "สิ่งที่ต้องดำเนินการไม่เกิน 3 เรื่อง", `<div class="v13-list">
          ${actionAlert("Priority Dealer", ctx.dealers[0]?.name || "-", "ติดตามยอดส่งมอบและ Booking วันนี้", 100)}
          ${actionAlert("Priority Model", ctx.models[0]?.name || "-", "เตรียม Stock และใบเสนอราคา", 82)}
          ${actionAlert("Key Alert", `${fmt(Math.max(TARGETS.sales - ctx.summary.units, 0))} units gap`, "ยอดที่ยังขาดจากเป้าหมาย", 66)}
        </div>`)}
      </section>
      <section class="v13-grid two">
        ${chartCard("Sales / Booking / Landing / Collection", "Target vs Actual", `<div class="v13-chart"><canvas id="focusTargetChart"></canvas></div>`)}
        ${chartCard("Detail table / ranking", "Dealer ที่ต้องโฟกัส", `<div id="dealerRanking" class="v13-list"></div>`)}
      </section>
    `);
    targetChart("focusTargetChart", ["Sales", "Booking", "Landing", "Collection"], [ctx.summary.units, ctx.booking, ctx.landing, ctx.collectionRate], [TARGETS.sales, TARGETS.booking, TARGETS.landing, TARGETS.collection]);
    rankingTable("dealerRanking", ctx.dealers);
    insights(["Recommendation: เริ่มจาก Booking ที่พร้อมส่งมอบก่อน เพื่อเปลี่ยนเป็น Delivery วันนี้", "Risk Signal: Model ขายดีต้องเช็ก Ready to Sell ก่อนเสนอราคาเพิ่ม", "Action Required: Dealer อันดับบนควรมี call สั้นทุกเช้าเพื่อคุมจังหวะปิดยอด"]);
  }

  function sales(ctx) {
    html("mainArea", `
      ${sectionLabel("Main analysis area")}
      <section class="v13-grid">
        ${chartCard("Sales Trend", "Line chart for MTD / YTD movement.", `<div class="v13-chart"><canvas id="salesTrendChart"></canvas></div>`, "v13-span-2")}
        ${chartCard("Pipeline", "Funnel chart from leads to delivery.", `<div id="salesFunnel" class="v13-funnel"></div>`)}
      </section>
      <section class="v13-grid">
        ${chartCard("Sales by Dealer", "Horizontal ranking.", `<div id="salesDealerRanking" class="v13-list"></div>`)}
        ${chartCard("Target Achievement", "Progress vs sales target.", progressRows([["Sales Target", ctx.summary.units, TARGETS.sales], ["Booking Target", ctx.booking, TARGETS.booking], ["Forecast", ctx.forecast, TARGETS.sales]]))}
        ${chartCard("GP / GP%", "Profit quality by current filter.", `<div class="v13-metric-stack">${metric("GP", money(ctx.summary.gp), "กำไรรวม")}${metric("GP%", U.formatPercent(ctx.summary.gpPct), "อัตรากำไร")}</div>`)}
      </section>
      <section class="v13-grid two">
        ${chartCard("Sales by Branch", "Dealer / Branch comparison.", `<div id="branchRanking" class="v13-list"></div>`)}
        ${chartCard("Sales by Model / Salesperson", "Detail table / ranking.", `<div class="v13-split"><div id="modelRanking" class="v13-list"></div><div id="salesPersonRanking" class="v13-list"></div></div>`)}
      </section>
    `);
    line("salesTrendChart", ctx.months, "Units");
    funnel("salesFunnel", [["Leads", ctx.booking * 2], ["Qualified", Math.round(ctx.booking * 1.35)], ["Booking", ctx.booking], ["Delivery", ctx.summary.units]]);
    rankingTable("salesDealerRanking", ctx.dealers);
    rankingTable("branchRanking", ctx.branches);
    rankingTable("modelRanking", ctx.models, "Model");
    rankingTable("salesPersonRanking", ctx.salesmen, "Salesperson");
    insights(["Recommendation: ดูยอดขายคู่กับ GP% เพื่อรักษาคุณภาพกำไร", "Risk Signal: Pipeline ที่ตกจาก Booking เป็น Delivery ต้องมีเจ้าของดีลชัดเจน", "Action Required: Dealer ranking ช่วยเลือกพื้นที่ follow-up ก่อนช่วงบ่าย"]);
  }

  function market(ctx) {
    html("mainArea", `
      ${sectionLabel("Main analysis area")}
      <section class="v13-grid">
        ${chartCard("Market Opportunity", "Area focus, campaign and Dealer activity.", `<div class="v13-chart"><canvas id="marketOpportunityChart"></canvas></div>`, "v13-span-2", true)}
        ${chartCard("Customer Visit Plan", "Customer leads to qualified visit.", `<div id="visitPlan" class="v13-list"></div>`, "", true)}
      </section>
      <section class="v13-grid four">
        ${simpleCard("Customer Leads", demo.market.leads, "Sample / Demo lead pool", true)}
        ${simpleCard("Qualified Leads", demo.market.qualified, "ลูกค้าที่มี Model และงบประมาณชัดเจน", true)}
        ${simpleCard("Campaign Performance", `${demo.market.campaign}%`, "Sample / Demo campaign result", true)}
        ${simpleCard("Competitor Activity", "Medium", demo.market.competitor, true)}
      </section>
      <section class="v13-grid two">
        ${chartCard("Area Focus / Dealer Activity", "Detail table / ranking.", `<div id="regionFocus" class="v13-list"></div>`)}
        ${chartCard("Crop / Season / Price / Weather", "Market signals for opportunity timing.", `<div id="marketSignals" class="v13-list"></div>`, "", true)}
      </section>
    `);
    bar("marketOpportunityChart", ctx.regions.slice(0, 8), "Opportunity units");
    rankingTable("regionFocus", ctx.regions);
    list("visitPlan", [["KMM02 lead group", "โทรวันนี้ นัดเข้าพบพรุ่งนี้", 96], ["Mon rice farmer leads", "เสนอแพ็กเกจ Demo tractor", 76], ["Shan dealer prospects", "ติดตาม Finance", 62]]);
    list("marketSignals", [["Rice Price", demo.market.ricePrice, 78], ["Fuel Price", demo.market.fuelPrice, 54], ["Weather / Field Condition", demo.market.weather, 82]]);
    insights(["Recommendation: ข้อมูล Market ยังเป็น Sample / Demo แต่โครงสร้างพร้อมต่อข้อมูลจริง", "Risk Signal: Lead ที่ Qualified แล้วควรผูกกับ Visit Plan และ Ready to Sell", "Action Required: ใช้ Area Focus เพื่อเลือก Dealer activity รายวัน"]);
  }

  function stock(ctx) {
    html("mainArea", `
      ${sectionLabel("Main analysis area")}
      <section class="v13-grid">
        ${chartCard("Stock by Model", "Current Stock and Ready to Sell.", `<div class="v13-chart"><canvas id="stockModelChart"></canvas></div>`, "v13-span-2")}
        ${chartCard("Fast / Slow Moving", "Simple composition by stock speed.", `<div class="v13-chart sm"><canvas id="stockComposition"></canvas></div>`)}
      </section>
      <section class="v13-grid two">
        ${chartCard("Ready to Sell / Landing / ETA", "Progress by Model.", `<div id="readyStock" class="v13-list"></div>`)}
        ${chartCard("Stock Aging / Back Order", "Detail table / ranking.", `<div id="stockAging" class="v13-list"></div>`)}
      </section>
      <section class="v13-grid two">
        ${chartCard("Stock by Dealer / Branch", "Dealer stock focus.", `<div id="stockDealer" class="v13-list"></div>`)}
        ${chartCard("Stock Alert", "รุ่นที่ต้องดำเนินการ", `<div id="stockAlert" class="v13-list"></div>`)}
      </section>
    `);
    stockChart("stockModelChart", ctx.stockRows);
    donut("stockComposition", stockSpeedRows(ctx.stockRows));
    list("readyStock", ctx.stockRows.slice(0, 8).map((row) => [row.name, `${fmt(row.ready)} Ready to Sell / ${fmt(row.landing)} Landing / ETA 7-14 days`, pct(row.ready, row.stock)]));
    list("stockAging", ctx.stockRows.slice(0, 8).map((row) => [row.name, `${row.aging} days | Back Order ${row.backOrder}`, Math.min(100, row.aging)]));
    list("stockDealer", ctx.stockRows.slice(0, 8).map((row) => [row.dealer, `${row.name} | ${fmt(row.stock)} Stock`, pct(row.ready, row.stock)]));
    list("stockAlert", ctx.stockRows.slice(0, 5).map((row) => [row.speed, `${row.name} | อายุสต็อก ${row.aging} days`, row.speed === "Slow Moving" ? 90 : 55]));
    insights(["Recommendation: Ready to Sell ต้องดูทั้งจำนวน Stock และอายุสต็อก", "Risk Signal: Slow Moving ควรจับคู่ Campaign หรือ Dealer ที่มี demand", "Action Required: Fast Moving ต้องกัน Stock สำหรับดีลที่มี Booking แล้ว"]);
  }

  function team(ctx) {
    html("mainArea", `
      ${sectionLabel("Main analysis area")}
      <section class="v13-grid">
        ${chartCard("Sales Team Structure", "Organization chart foundation.", `<div id="orgChart" class="v13-org"></div>`)}
        ${chartCard("Salesperson Ranking", "Target achievement by person.", `<div class="v13-chart"><canvas id="teamRankingChart"></canvas></div>`, "v13-span-2")}
      </section>
      <section class="v13-grid">
        ${chartCard("Activity Tracking", "Calls, follow-up, visit activity.", `<div id="activityList" class="v13-list"></div>`, "", true)}
        ${chartCard("Dealer Assignment / Visit Plan", "Detail table / ranking.", `<div id="assignmentList" class="v13-list"></div>`)}
        ${chartCard("Training / Skill Status", "Coaching readiness.", `<div id="trainingList" class="v13-list"></div>`, "", true)}
      </section>
    `);
    bar("teamRankingChart", ctx.salesmen.slice(0, 10), "Units");
    orgChart("orgChart", [["Sales Manager", "Daily target owner"], ["Senior Sales", "Dealer coaching and closing"], ["Salesperson", "Visit, call, booking, delivery"]]);
    list("activityList", ctx.salesmen.slice(0, 6).map((row, i) => [row.name, `${8 + i} calls / ${2 + i % 3} visits / follow-up ${4 + i}`, 72 - i * 5]));
    list("assignmentList", ctx.salesmen.slice(0, 6).map((row, i) => [row.name, `${ctx.dealers[i % Math.max(ctx.dealers.length, 1)]?.name || "KMM"} | Visit plan`, Math.max(42, 92 - i * 7)]));
    list("trainingList", [["Product skill", "Tractor and combine refresh", 84], ["Finance skill", "Booking to collection discipline", 71], ["Closing skill", "Objection handling", 66]]);
    insights(["Recommendation: Top performer ควรถอด Playbook ให้ทีมใช้ใน Dealer ใกล้เคียง", "Risk Signal: At-risk salesperson ต้องมี Coaching action ไม่ใช่ดู Ranking อย่างเดียว", "Action Required: Visit Plan ควรผูกกับ Opportunity และ Ready Stock"]);
  }

  function reports(ctx) {
    html("mainArea", `
      ${sectionLabel("Main analysis area")}
      <section class="v13-grid four">
        ${reportCard("Daily Report", "Ready", "Focus, Delivery, Booking, Alerts")}
        ${reportCard("Weekly Report", "Ready", "Dealer ranking, Model ranking, Team action")}
        ${reportCard("Monthly Report", "Draft", "MTD / YTD, GP, Target achievement")}
        ${reportCard("KPI Report", "Ready", "Sales, Booking, Stock, Team")}
      </section>
      <section class="v13-grid">
        ${chartCard("Sales / Booking / Stock / Team Report", "Report cards for operating review.", `<div id="reportList" class="v13-list"></div>`)}
        ${chartCard("Export Center", "Export PDF, Excel, PowerPoint.", `<div id="exportList" class="v13-list"></div>`)}
        ${chartCard("Report Archive", "Reviewed report history.", `<div id="archiveList" class="v13-list"></div>`, "", true)}
      </section>
    `);
    list("reportList", [["Sales Report", `${fmt(ctx.summary.units)} units | GP ${U.formatPercent(ctx.summary.gpPct)}`, pct(ctx.summary.units, TARGETS.sales)], ["Booking Report", `${fmt(ctx.booking)} bookings`, pct(ctx.booking, TARGETS.booking)], ["Stock Report", `${fmt(ctx.readyStock)} Ready to Sell`, pct(ctx.readyStock, ctx.currentStock)], ["Team Report", `${ctx.salesmen.length} salesperson`, 82]]);
    list("exportList", [["Export PDF", "Board and daily review format", 100], ["Export Excel", "Detail table for sales operations", 92], ["Export PowerPoint", "One-page meeting brief", 88]]);
    list("archiveList", [["Daily Sales Command", "Updated today", 100], ["Weekly Dealer Review", "Last week", 86], ["Stock Alert Pack", "Sample / Demo archive", 74]]);
    insights(["Recommendation: รายงานประจำวันควรเริ่มจาก Focus ไม่ใช่กราฟทั้งหมด", "Risk Signal: Monthly Report ยังเป็น Draft จนกว่าจะปิดงวด", "Action Required: Excel ใช้สำหรับ Detail action ส่วน PDF / PowerPoint ใช้สำหรับประชุม"]);
  }

  function kpiCard(item) {
    return `<article class="v13-kpi"><span>${item.name}</span><strong>${item.value}</strong><small>${item.note}</small></article>`;
  }

  function focusCard(label, title, value, text) {
    return `<div class="v13-focus-item"><b>${label}</b><div><strong>${title}</strong><small>${text}</small></div><span class="v13-pill">${fmt(value)} units</span></div>`;
  }

  function chartCard(title, subtitle, body, extraClass = "", isDemo = false) {
    return `<article class="v13-panel ${extraClass}"><div class="v13-panel-head"><div><h2>${title} ${isDemo ? statusBadge("Sample / Demo") : ""}</h2><p>${subtitle}</p></div></div>${body}</article>`;
  }

  function simpleCard(title, value, text, isDemo = false) {
    return `<article class="v13-card"><span>${title} ${isDemo ? statusBadge("Sample / Demo") : ""}</span><h3>${value}</h3><p>${text}</p></article>`;
  }

  function reportCard(title, value, text) {
    return `<article class="v13-card v13-report-card"><span>${title}</span><h3>${value}</h3><p>${text}</p></article>`;
  }

  function statusBadge(text) {
    return `<em class="v13-demo">${text}</em>`;
  }

  function actionAlert(title, subtitle, pill, percent) {
    return row(title, subtitle, pill, percent, "v13-alert-row");
  }

  function rankingTable(id, rows, label = "Dealer") {
    list(id, rows.slice(0, 8).map((row) => [row.name, `${label}: ${fmt(row.units)} units | GP ${U.formatPercent(row.gpPct)}`, row.share]));
  }

  function list(id, rows) {
    html(id, rows.map((item) => row(item[0], item[1], "", item[2])).join(""));
  }

  function row(title, subtitle, pill, percent, extraClass = "") {
    return `<div class="v13-row ${extraClass}"><div><strong>${title}</strong><small>${subtitle}</small><div class="v13-bar"><i style="width:${Math.max(4, Math.min(100, percent || 0))}%"></i></div></div>${pill ? `<span class="v13-pill">${pill}</span>` : ""}</div>`;
  }

  function sectionLabel(text) {
    return `<div class="v13-section-label"><span>${text}</span></div>`;
  }

  function progressRows(rows) {
    return `<div class="v13-list">${rows.map(([name, value, total]) => row(name, `${fmt(value)} / ${fmt(total)} units`, `${pct(value, total)}%`, pct(value, total))).join("")}</div>`;
  }

  function metric(title, value, note) {
    return `<div class="v13-metric"><span>${title}</span><strong>${value}</strong><small>${note}</small></div>`;
  }

  function orgChart(id, rows) {
    html(id, rows.map(([title, subtitle]) => `<div><strong>${title}</strong><small>${subtitle}</small></div>`).join(""));
  }

  function insights(items) {
    html("insightArea", `<div class="v13-section-label"><span>Action / Insight panel</span></div>${items.slice(0, 3).map((item) => `<article class="v13-insight"><span>${item.split(":")[0]}</span><strong>${item.replace(/^[^:]+:\s*/, "")}</strong></article>`).join("")}`);
  }

  function line(id, rows, label) {
    C.renderChart(id, {
      type: "line",
      data: { labels: rows.map((r) => r.name), datasets: [{ label, data: rows.map((r) => r.units), borderColor: "#ff5a00", backgroundColor: "rgba(255,90,0,.12)", fill: true }] }
    });
  }

  function bar(id, rows, label) {
    C.renderChart(id, {
      type: "bar",
      data: { labels: rows.map((r) => r.name), datasets: [{ label, data: rows.map((r) => r.units), backgroundColor: "#222b3f" }] },
      options: { indexAxis: "y", plugins: { legend: { display: false } } }
    });
  }

  function donut(id, rows) {
    C.renderChart(id, {
      type: "doughnut",
      data: { labels: rows.slice(0, 6).map((r) => r.name), datasets: [{ data: rows.slice(0, 6).map((r) => r.units), backgroundColor: ["#ff5a00", "#222b3f", "#12b89d", "#ffb000", "#7a8599", "#d6dbe3"] }] }
    });
  }

  function targetChart(id, labels, actual, target) {
    C.renderChart(id, {
      type: "bar",
      data: { labels, datasets: [{ label: "Actual", data: actual, backgroundColor: "#ff5a00" }, { label: "Target", data: target, backgroundColor: "#d6dbe3" }] }
    });
  }

  function stockChart(id, rows) {
    const top = rows.slice(0, 8).reverse();
    C.renderChart(id, {
      type: "bar",
      data: { labels: top.map((r) => r.name), datasets: [{ label: "Current Stock", data: top.map((r) => r.stock), backgroundColor: "#222b3f" }, { label: "Ready to Sell", data: top.map((r) => r.ready), backgroundColor: "#12b89d" }] },
      options: { indexAxis: "y" }
    });
  }

  function funnel(id, rows) {
    const max = rows[0]?.[1] || 1;
    html(id, rows.map(([label, value]) => `<div style="width:${Math.max(32, value / max * 100)}%"><span>${label}</span><strong>${fmt(value)}</strong></div>`).join(""));
  }

  function stockSpeedRows(rows) {
    return ["Fast Moving", "Normal", "Slow Moving"].map((name) => ({ name, units: rows.filter((row) => row.speed === name).length || 1 }));
  }

  function markActiveMenu() {
    const page = currentPage();
    document.querySelectorAll(".v13-sidebar .nav-menu a").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `${page}.html`);
    });
  }

  function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function html(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }

  function fmt(value) {
    return Number(value || 0).toLocaleString();
  }

  function money(value) {
    return U.formatMoney(value || 0);
  }

  function pct(value, total) {
    return total ? Math.round((Number(value || 0) / Number(total || 1)) * 100) : 0;
  }

  function average(values) {
    const clean = values.filter((value) => Number.isFinite(Number(value)));
    return clean.length ? clean.reduce((sum, value) => sum + Number(value), 0) / clean.length : 0;
  }
})(window);
