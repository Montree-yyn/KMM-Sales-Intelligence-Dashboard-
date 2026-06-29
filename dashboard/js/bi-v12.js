(function (window) {
  "use strict";

  const BI = window.BI || {};

  function U() {
    return BI.utils;
  }

  function isThai() {
    return window.KMMI18n ? window.KMMI18n.getLanguage() === "th" : true;
  }

  function unitText(value) {
    return isThai()
      ? `${Number(value || 0).toLocaleString()} คัน`
      : `${Number(value || 0).toLocaleString()} units`;
  }

  function money(value) {
    return U().formatMoney(value);
  }

  function pct(value) {
    return U().formatPercent(value);
  }

  function safeRows(rows) {
    return rows && rows.length ? rows : [];
  }

  function monthIndex(item) {
    return Number(item.year || 0) * 12 + Number(item.month || 0);
  }

  function maxMonthIndex(data) {
    return Math.max(...data.map(monthIndex), 0);
  }

  function paymentRatio(row) {
    return row.sales ? (row.netReceived / row.sales) * 100 : 0;
  }

  function riskLevel(score) {
    if (score >= 70) return isThai() ? "สูง" : "High";
    if (score >= 42) return isThai() ? "กลาง" : "Medium";
    return isThai() ? "ต่ำ" : "Low";
  }

  function statusClass(score) {
    if (score >= 70) return "bad";
    if (score >= 42) return "warn";
    return "good";
  }

  function statusText(score) {
    if (score >= 70) return isThai() ? "ต้องเร่งติดตาม" : "Action";
    if (score >= 42) return isThai() ? "เฝ้าระวัง" : "Watch";
    return isThai() ? "ปกติ" : "Stable";
  }

  function buildGroups(data, getter) {
    const map = {};
    data.forEach((item) => {
      const name = getter(item) || "Unknown";
      if (!map[name]) {
        map[name] = {
          name,
          units: 0,
          sales: 0,
          gp: 0,
          netReceived: 0,
          cashUnits: 0,
          newest: 0,
          oldest: 999999,
          records: []
        };
      }
      const row = map[name];
      row.units += 1;
      row.sales += U().valueOf(item);
      row.gp += U().gpOf(item);
      row.netReceived += U().number(item.netReceived);
      row.cashUnits += String(item.payment || item.purchaseType || "").toUpperCase().includes("CASH") ? 1 : 0;
      row.newest = Math.max(row.newest, monthIndex(item));
      row.oldest = Math.min(row.oldest, monthIndex(item));
      row.records.push(item);
    });

    const totalUnits = data.length || 1;
    return Object.values(map)
      .map((row) => ({
        ...row,
        gpPct: row.sales ? (row.gp / row.sales) * 100 : 0,
        collectionPct: paymentRatio(row),
        share: (row.units / totalUnits) * 100
      }))
      .sort((a, b) => b.units - a.units);
  }

  function buildAging(data) {
    const maxIndex = maxMonthIndex(data);
    const buckets = [
      { label: "0-30", units: 0 },
      { label: "31-60", units: 0 },
      { label: "61-90", units: 0 },
      { label: "90+", units: 0 }
    ];
    data.forEach((item) => {
      const age = Math.max(0, maxIndex - monthIndex(item));
      const bucket = age <= 0 ? 0 : age <= 1 ? 1 : age <= 2 ? 2 : 3;
      buckets[bucket].units += 1;
    });
    return buckets;
  }

  function scoreDealer(row, leaderUnits) {
    const volumePressure = leaderUnits ? Math.max(0, 1 - row.units / leaderUnits) * 30 : 0;
    const marginPressure = row.gpPct < 8 ? 25 : row.gpPct < 11 ? 12 : 0;
    const collectionPressure = row.collectionPct < 88 ? 18 : row.collectionPct < 95 ? 8 : 0;
    const bookingPressure = row.units < leaderUnits * 0.35 ? 14 : row.units < leaderUnits * 0.55 ? 7 : 0;
    const stockPressure = row.share < 4 ? 13 : row.share < 8 ? 6 : 0;
    return Math.round(Math.min(100, volumePressure + marginPressure + collectionPressure + bookingPressure + stockPressure));
  }

  function analyze(data) {
    const rows = safeRows(data);
    const summary = U().kpi(rows);
    const dealers = buildGroups(rows, (item) => item.dealer);
    const models = buildGroups(rows, (item) => item.model);
    const salesmen = buildGroups(rows, U().salesmanName);
    const leaderUnits = dealers[0]?.units || 1;
    const modelAverage = models.length ? summary.units / models.length : 0;
    const aging = buildAging(rows);
    const bookingProxy = Math.round(summary.units * 1.18);
    const depositPct = summary.sales
      ? (rows.reduce((sum, item) => sum + U().number(item.netReceived), 0) / summary.sales) * 100
      : 0;
    const conversionPct = bookingProxy ? (summary.units / bookingProxy) * 100 : 0;

    const dealerScorecards = dealers.map((row) => {
      const riskScore = scoreDealer(row, leaderUnits);
      const recommendation = riskScore >= 70
        ? (isThai() ? "ประชุมแผนปิดยอดและทบทวน collection รายสัปดาห์" : "Run weekly close and collection review.")
        : riskScore >= 42
          ? (isThai() ? "ติดตาม booking และ stock mix ก่อนสิ้นงวด" : "Track booking and stock mix before period close.")
          : (isThai() ? "รักษาจังหวะขายและปกป้อง GP" : "Sustain sales rhythm and protect GP.");
      return {
        ...row,
        bookingProxy: Math.round(row.units * 1.18),
        stockRisk: row.share < 6 ? (isThai() ? "เสี่ยงสต็อกไม่พอ/หมุนช้า" : "Availability/slow stock risk") : (isThai() ? "สต็อกสมดุลตามยอดขาย" : "Balanced stock signal"),
        riskScore,
        riskLevel: riskLevel(riskScore),
        recommendation
      };
    });

    const stockRows = models.map((row) => {
      const velocity = row.units >= modelAverage * 1.2 ? "fast" : row.units <= modelAverage * 0.65 ? "slow" : "steady";
      const riskScore = velocity === "slow" ? 72 : row.gpPct < 8 ? 58 : velocity === "fast" ? 26 : 38;
      return {
        ...row,
        velocity,
        stockAge: row.newest ? Math.max(0, maxMonthIndex(rows) - row.newest) : 0,
        availability: velocity === "fast"
          ? (isThai() ? "ควรยืนยันสินค้าให้พร้อมส่งมอบ" : "Confirm availability for delivery.")
          : velocity === "slow"
            ? (isThai() ? "ทบทวนโปรโมชันหรือย้ายสต็อก" : "Review promotion or stock transfer.")
            : (isThai() ? "ติดตามอัตราหมุนปกติ" : "Monitor normal turn."),
        riskScore
      };
    });

    const salesmanRows = salesmen.map((row) => {
      const activityProxy = Math.round(row.units * 2.8);
      const coaching = row.gpPct < 8
        ? (isThai() ? "โค้ชเรื่องราคา ส่วนลด และดีล GP ต่ำ" : "Coach pricing, discounting, and low-GP deals.")
        : row.share < 5
          ? (isThai() ? "เพิ่มกิจกรรม prospect และ booking รายสัปดาห์" : "Increase weekly prospecting and booking activity.")
          : (isThai() ? "ถอด playbook การปิดดีลเพื่อแชร์ทีม" : "Turn close rhythm into a team playbook.");
      return {
        ...row,
        bookingProxy: Math.round(row.units * 1.18),
        activityProxy,
        coaching
      };
    });

    const slowModel = stockRows.slice().sort((a, b) => b.riskScore - a.riskScore)[0];
    const fastModel = stockRows.find((row) => row.velocity === "fast") || stockRows[0];
    const riskiestDealer = dealerScorecards.slice().sort((a, b) => b.riskScore - a.riskScore)[0];
    const coachFocus = salesmanRows.slice().sort((a, b) => a.gpPct - b.gpPct)[0];

    return {
      rows,
      summary,
      booking: {
        aging,
        bookingProxy,
        depositPct,
        conversionPct,
        dealerRisk: riskiestDealer
      },
      stock: {
        aging,
        rows: stockRows,
        fastModel,
        slowModel
      },
      dealerScorecards,
      salesmanRows,
      briefing: {
        summary: rows.length
          ? (isThai()
            ? `ยอดส่งมอบ ${unitText(summary.units)} มูลค่า ${money(summary.sales)} GP ${pct(summary.gpPct)} โดยใช้สัญญาณ V12 จาก dashboard_data.json เท่านั้น`
            : `${unitText(summary.units)} delivered, ${money(summary.sales)} sales value, ${pct(summary.gpPct)} GP using dashboard_data.json only.`)
          : (isThai() ? "ไม่พบข้อมูลตามตัวกรองปัจจุบัน" : "No data in the current filter."),
        risks: [
          riskiestDealer ? `${isThai() ? "Dealer เสี่ยง" : "Dealer risk"}: ${riskiestDealer.name} (${riskiestDealer.riskLevel})` : "-",
          slowModel ? `${isThai() ? "Slow moving" : "Slow moving"}: ${slowModel.name}` : "-",
          `${isThai() ? "Deposit signal" : "Deposit signal"}: ${pct(depositPct)}`
        ],
        opportunities: [
          fastModel ? `${isThai() ? "Fast moving" : "Fast moving"}: ${fastModel.name}` : "-",
          dealers[0] ? `${isThai() ? "Dealer หลัก" : "Top dealer"}: ${dealers[0].name} ${unitText(dealers[0].units)}` : "-",
          salesmen[0] ? `${isThai() ? "Salesman นำทีม" : "Top salesman"}: ${salesmen[0].name}` : "-"
        ],
        actions: [
          riskiestDealer ? `${isThai() ? "ติดตาม" : "Follow up"} ${riskiestDealer.name}: ${riskiestDealer.recommendation}` : "-",
          slowModel ? `${isThai() ? "ทบทวน stock aging" : "Review stock aging"} ${slowModel.name}` : "-",
          coachFocus ? `${isThai() ? "โค้ช" : "Coach"} ${coachFocus.name}: ${coachFocus.coaching}` : "-"
        ]
      }
    };
  }

  function rowClass(score) {
    return `v12-status ${statusClass(score)}`;
  }

  function renderScoreRows(id, rows, mapper) {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = rows.length
      ? rows.map(mapper).join("")
      : `<div class="v12-empty">${isThai() ? "ไม่มีข้อมูลตามตัวกรอง" : "No data in current filter"}</div>`;
  }

  function renderList(id, rows) {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = rows.map((item) => `<li>${item}</li>`).join("");
  }

  function renderBooking(id, intel) {
    renderScoreRows(id, [
      { label: isThai() ? "Aging Booking" : "Aging Booking", value: unitText(intel.booking.aging[3]?.units || 0), meta: isThai() ? "Proxy 90+ จากงวดขายเก่า" : "90+ proxy from older sales periods", score: (intel.booking.aging[3]?.units || 0) ? 58 : 24 },
      { label: isThai() ? "Deposit signal" : "Deposit signal", value: pct(intel.booking.depositPct), meta: isThai() ? "netReceived / MSRP ตามข้อมูลขาย" : "netReceived / MSRP from sales data", score: intel.booking.depositPct < 88 ? 72 : 28 },
      { label: isThai() ? "Booking conversion" : "Booking conversion", value: pct(intel.booking.conversionPct), meta: isThai() ? "Placeholder: ส่งมอบ / booking proxy" : "Placeholder: delivery / booking proxy", score: 35 },
      { label: isThai() ? "Dealer booking risk" : "Dealer booking risk", value: intel.booking.dealerRisk?.name || "-", meta: intel.booking.dealerRisk?.recommendation || "-", score: intel.booking.dealerRisk?.riskScore || 0 }
    ], (item) => `
      <article class="v12-signal-card">
        <span>${item.label}</span>
        <strong>${item.value}</strong>
        <small>${item.meta}</small>
        <b class="${rowClass(item.score)}">${statusText(item.score)}</b>
      </article>`);
  }

  function renderStock(id, intel) {
    renderScoreRows(id, intel.stock.rows.slice(0, 6), (row) => `
      <article class="v12-signal-card">
        <span>${row.velocity === "fast" ? (isThai() ? "Fast moving" : "Fast moving") : row.velocity === "slow" ? (isThai() ? "Slow moving" : "Slow moving") : (isThai() ? "Steady" : "Steady")}</span>
        <strong>${row.name}</strong>
        <small>${unitText(row.units)} | GP ${pct(row.gpPct)} | ${row.availability}</small>
        <b class="${rowClass(row.riskScore)}">${riskLevel(row.riskScore)}</b>
      </article>`);
  }

  function renderDealerScorecard(id, intel) {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = `
      <div class="v12-table-scroll">
        <table class="v12-table">
          <thead><tr><th>Dealer</th><th>Sales</th><th>Booking</th><th>Stock</th><th>GP</th><th>Collection</th><th>Risk</th><th>Recommendation</th></tr></thead>
          <tbody>${intel.dealerScorecards.slice(0, 8).map((row) => `
            <tr>
              <td>${row.name}</td>
              <td>${unitText(row.units)}</td>
              <td>${unitText(row.bookingProxy)}</td>
              <td>${row.stockRisk}</td>
              <td>${pct(row.gpPct)}</td>
              <td>${pct(row.collectionPct)}</td>
              <td><span class="${rowClass(row.riskScore)}">${row.riskLevel}</span></td>
              <td>${row.recommendation}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  function renderSalesman(id, intel) {
    renderScoreRows(id, intel.salesmanRows.slice(0, 6), (row) => `
      <article class="v12-salesman-card">
        <strong>${row.name}</strong>
        <span>${isThai() ? "Sales" : "Sales"} ${unitText(row.units)} | GP ${pct(row.gpPct)}</span>
        <span>${isThai() ? "Booking" : "Booking"} ${unitText(row.bookingProxy)} | ${isThai() ? "Activity placeholder" : "Activity placeholder"} ${row.activityProxy.toLocaleString()}</span>
        <small>${row.coaching}</small>
      </article>`);
  }

  function renderBriefing(intel) {
    const summary = document.getElementById("v12BriefSummary");
    if (summary) summary.textContent = intel.briefing.summary;
    renderList("v12KeyRisks", intel.briefing.risks);
    renderList("v12KeyOpportunities", intel.briefing.opportunities);
    renderList("v12NextActions", intel.briefing.actions);
  }

  function render(data, targets = {}) {
    const intel = analyze(data);
    if (targets.briefing) renderBriefing(intel);
    if (targets.booking) renderBooking(targets.booking, intel);
    if (targets.stock) renderStock(targets.stock, intel);
    if (targets.dealerScorecard) renderDealerScorecard(targets.dealerScorecard, intel);
    if (targets.salesman) renderSalesman(targets.salesman, intel);
    return intel;
  }

  BI.v12 = { analyze, render };
  window.BI = BI;
})(window);
