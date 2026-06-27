let commissionChart = null;

window.addEventListener("DOMContentLoaded", async () => {
    await loadDashboardData();
    populateSalesmanFilters();
    bindSalesmanEvents();
    updateSalesmanDashboard();
});

function getSalesmanName(item) {
    return item["SL Name"] || item.slName || item.salesman || item.salesmanName || "Unknown";
}

function getSalesCommission(item) {
    return (
        Number(item["Volume Incentive"] || 0) +
        Number(item["Model Incentive"] || 0) +
        Number(item["Special Incentive (Cash)"] || 0) +
        Number(item["Broker"] || 0) +
        Number(item["Admin Commission"] || 0) +
        Number(item["Admin Member Plus"] || 0) +
        Number(item["Leader Com"] || 0)
    );
}

function populateSalesmanFilters() {
    const data = getCoreProductData();

    fillSelect("yearFilter", getUniqueValues(data, "year").sort(), "All years");
    fillSelect("monthFilter", getUniqueValues(data, "month").sort((a, b) => Number(a) - Number(b)), "All months", formatMonth);
    fillSelect("weekFilter", getUniqueValues(data, "week").sort((a, b) => getWeekNo(a) - getWeekNo(b)), "All weeks", v => "W" + String(getWeekNo(v)).padStart(2, "0"));
    fillSelect("dealerFilter", getUniqueValues(data, "dealer").sort(), "All dealers");

    const salesmen = [...new Set(data.map(getSalesmanName).filter(Boolean))].sort();
    fillSelect("salesmanFilter", salesmen, "All salesmen");
}

function fillSelect(id, values, defaultLabel, formatter) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = `<option value="">${defaultLabel}</option>`;

    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = formatter ? formatter(value) : value;
        select.appendChild(option);
    });
}

function bindSalesmanEvents() {
    ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "salesmanFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", updateSalesmanDashboard);
    });

    const reset = document.getElementById("resetFilter");
    if (reset) {
        reset.addEventListener("click", () => {
            ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "salesmanFilter"].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = "";
            });
            updateSalesmanDashboard();
        });
    }
}

function getSalesmanFilteredData() {
    const year = document.getElementById("yearFilter").value;
    const month = document.getElementById("monthFilter").value;
    const week = document.getElementById("weekFilter").value;
    const dealer = document.getElementById("dealerFilter").value;
    const salesman = document.getElementById("salesmanFilter").value;

    return getCoreProductData().filter(item => {
        return (
            (!year || String(item.year) === String(year)) &&
            (!month || String(item.month) === String(month)) &&
            (!week || getWeekNo(item.week) === getWeekNo(week)) &&
            (!dealer || String(item.dealer) === String(dealer)) &&
            (!salesman || getSalesmanName(item) === salesman)
        );
    });
}

function updateSalesmanDashboard() {
    const data = getSalesmanFilteredData();
    const kpi = getKPIData(data);
    const totalCommission = data.reduce((sum, item) => sum + getSalesCommission(item), 0);

    document.getElementById("recordCount").innerHTML = data.length.toLocaleString();
    document.getElementById("lastRefresh").innerHTML = getLastRefresh();

    document.getElementById("salesUnits").innerHTML = kpi.units.toLocaleString();
    document.getElementById("salesValue").innerHTML = formatMoney(kpi.salesValue);
    document.getElementById("grossProfit").innerHTML = formatMoney(kpi.grossProfit);
    document.getElementById("gpPercent").innerHTML = kpi.gpPercent.toFixed(1) + "%";
    document.getElementById("salesCommission").innerHTML = formatMoney(totalCommission);
    document.getElementById("totalCommissionTop").innerHTML = formatMoney(totalCommission);

    const summary = buildSalesmanSummary(data);

    renderSalesmanRanking(summary);
    renderSalesmanTable(summary);
    renderCommissionChart(summary);
    renderSalesmanAI(summary);
}

function buildSalesmanSummary(data) {
    const map = {};

    data.forEach(item => {
        const name = getSalesmanName(item);

        if (!map[name]) {
            map[name] = {
                name,
                units: 0,
                salesValue: 0,
                grossProfit: 0,
                commission: 0
            };
        }

        map[name].units += 1;
        map[name].salesValue += Number(item.msrp || item.salesValue || 0);
        map[name].grossProfit += Number(item.gp1 || item.grossProfit || 0);
        map[name].commission += getSalesCommission(item);
    });

    return Object.values(map)
        .map(item => ({
            ...item,
            gpPercent: item.salesValue > 0 ? (item.grossProfit / item.salesValue) * 100 : 0,
            commissionPerUnit: item.units > 0 ? item.commission / item.units : 0
        }))
        .sort((a, b) => b.units - a.units);
}

function renderSalesmanRanking(summary) {
    const target = document.getElementById("salesmanRankingList");
    if (!target) return;

    const maxUnits = summary.length ? summary[0].units : 1;

    target.innerHTML = summary.slice(0, 10).map((item, index) => {
        const percent = maxUnits > 0 ? (item.units / maxUnits) * 100 : 0;

        return `
      <div class="salesman-rank-item">
        <div class="salesman-rank-no">${index + 1}</div>
        <div>
          <div class="salesman-rank-name">${item.name}</div>
          <div class="salesman-rank-meta">
            ${item.units} units | GP ${item.gpPercent.toFixed(1)}% | Com/Unit ${formatMoney(item.commissionPerUnit)}
          </div>
          <div class="salesman-rank-bar">
            <div class="salesman-rank-fill" style="width:${percent}%"></div>
          </div>
        </div>
        <div class="salesman-rank-value">${formatMoney(item.commission)}</div>
      </div>
    `;
    }).join("");
}

function renderSalesmanTable(summary) {
    const tbody = document.getElementById("salesmanTableBody");
    if (!tbody) return;

    tbody.innerHTML = summary.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td class="text-right">${item.units.toLocaleString()}</td>
      <td class="text-right">${formatMoney(item.salesValue)}</td>
      <td class="text-right">${formatMoney(item.grossProfit)}</td>
      <td class="text-right">${item.gpPercent.toFixed(1)}%</td>
      <td class="text-right">${formatMoney(item.commission)}</td>
      <td class="text-right">${formatMoney(item.commissionPerUnit)}</td>
    </tr>
  `).join("");
}

function renderCommissionChart(summary) {
    const canvas = document.getElementById("commissionChart");
    if (!canvas) return;

    const top = summary
        .slice()
        .sort((a, b) => b.commission - a.commission)
        .slice(0, 8);

    if (commissionChart) commissionChart.destroy();

    commissionChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: top.map(x => x.name),
            datasets: [{
                data: top.map(x => x.commission),
                backgroundColor: ["#ff6f00", "#13b99a", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"],
                borderColor: "#fff",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

function renderSalesmanAI(summary) {
    const target = document.getElementById("salesmanAIInsight");
    if (!target) return;

    if (!summary.length) {
        target.innerHTML = `<div class="salesman-ai-card"><strong>No data</strong><p>Please adjust filters.</p></div>`;
        return;
    }

    const byCommission = summary.slice().sort((a, b) => b.commission - a.commission);
    const topSales = summary[0];
    const topCom = byCommission[0];
    const totalCom = summary.reduce((sum, item) => sum + item.commission, 0);

    target.innerHTML = `
    <div class="salesman-ai-card">
      <span>Top Salesman</span>
      <strong>${topSales.name}</strong>
      <p>${topSales.units} units, GP ${topSales.gpPercent.toFixed(1)}%</p>
    </div>

    <div class="salesman-ai-card">
      <span>Top Commission</span>
      <strong>${topCom.name}</strong>
      <p>${formatMoney(topCom.commission)} total commission</p>
    </div>

    <div class="salesman-ai-card">
      <span>Total Commission</span>
      <strong>${formatMoney(totalCom)}</strong>
      <p>รวมจาก Volume, Model, Special, Broker, Admin, Member Plus และ Leader Com</p>
    </div>
  `;
}