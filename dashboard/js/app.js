window.addEventListener("DOMContentLoaded", async () => {
    await loadDashboardData();

    populateFilters();
    bindFilterEvents();
    updateDashboard();
});

function populateFilters() {
    const data = getCoreProductData();

    fillSelect("yearFilter", getUniqueValues(data, "year").sort(), "All years");

    fillSelect(
        "monthFilter",
        getUniqueValues(data, "month").sort((a, b) => Number(a) - Number(b)),
        "All months",
        formatMonth
    );

    fillSelect(
        "weekFilter",
        getUniqueValues(data, "week").sort((a, b) => getWeekNo(a) - getWeekNo(b)),
        "All weeks",
        value => "W" + String(getWeekNo(value)).padStart(2, "0")
    );

    fillSelect("dealerFilter", getUniqueValues(data, "dealer").sort(), "All dealers");
    fillSelect("typeFilter", getUniqueValues(data, "type").sort(), "All core products");
}

function fillSelect(id, values, defaultLabel, labelFormatter) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultLabel;
    select.appendChild(defaultOption);

    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = labelFormatter ? labelFormatter(value) : value;
        select.appendChild(option);
    });
}

function bindFilterEvents() {
    ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "typeFilter"].forEach(id => {
        document.getElementById(id).addEventListener("change", updateDashboard);
    });

    document.getElementById("resetFilter").addEventListener("click", () => {
        ["yearFilter", "monthFilter", "weekFilter", "dealerFilter", "typeFilter"].forEach(id => {
            document.getElementById(id).value = "";
        });

        updateDashboard();
    });
}

function updateDashboard() {
    const data = getFilteredData();

    document.getElementById("recordCount").innerHTML =
        data.length.toLocaleString();

    document.getElementById("lastRefresh").innerHTML =
        getLastRefresh();

    updateKPI(data);
    renderWeeklyTrendChart(data);
    renderProductMixChart(data);
    renderTopModels(data);
    renderDealerRanking(data);
    updateAICommandCenter(data);
    updateBusinessHealth(data);
    updatePipeline(data);
    updateRiskAlert(data);
    updateQuickInsights(data);
}

function updateKPI(data) {
    const kpi = getKPIData(data);

    document.getElementById("salesUnits").innerHTML =
        kpi.units.toLocaleString();

    document.getElementById("salesValue").innerHTML =
        formatMoney(kpi.salesValue);

    document.getElementById("grossProfit").innerHTML =
        formatMoney(kpi.grossProfit);

    document.getElementById("gpPercent").innerHTML =
        kpi.gpPercent.toFixed(1) + "%";

    document.getElementById("averagePrice").innerHTML =
        formatMoney(kpi.averagePrice);
}

function formatMonth(value) {
    const months = [
        "",
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    return months[Number(value)] || value;
}
function renderRankingList(data, field, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const map = {};

    data.forEach(item => {
        const key = item[field] || "Unknown";
        map[key] = (map[key] || 0) + 1;
    });

    const ranked = Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    const maxValue = ranked.length ? ranked[0].value : 1;

    target.innerHTML = ranked.map((item, index) => {
        const percent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

        return `
      <div class="ranking-item">
        <div class="ranking-rank">${index + 1}</div>
        <div>
          <div class="ranking-name">${item.name}</div>
          <div class="ranking-bar">
            <div class="ranking-fill" style="width:${percent}%"></div>
          </div>
        </div>
        <div class="ranking-value">${item.value}</div>
      </div>
    `;
    }).join("");
}

function renderTopModels(data) {
    renderRankingList(data, "model", "topModelsList");
}

function renderDealerRanking(data) {
    renderRankingList(data, "dealer", "dealerRankingList");
}
function updateAICommandCenter(data) {
    const kpi = getKPIData(data);

    const topDealer = getTopItem(data, "dealer");
    const topProduct = getTopItem(data, "type");
    const topModel = getTopItem(data, "model");

    const summary = [
        `Core product sales reached ${kpi.units.toLocaleString()} units.`,
        `${topDealer.name} is the leading dealer with ${topDealer.share.toFixed(1)}% contribution.`,
        `${topProduct.name} is the strongest product group.`,
        `${topModel.name} is the best-selling model.`,
        `Current GP margin is ${kpi.gpPercent.toFixed(1)}%.`
    ];

    const recommendation = [];

    if (kpi.gpPercent < 8) {
        recommendation.push("GP margin is weak. Review discount policy and prioritize higher-margin models.");
    } else if (kpi.gpPercent < 10) {
        recommendation.push("GP margin is below preferred level. Monitor discount and campaign conditions.");
    }

    if (topDealer.share > 60) {
        recommendation.push("Dealer contribution is concentrated. Strengthen activity in other dealers to reduce dependency.");
    }

    if (topProduct.share > 70) {
        recommendation.push("Product mix is concentrated. Review demand risk and balance sales activities across core products.");
    }

    if (data.length < 10) {
        recommendation.push("Filtered sales volume is low. Check whether the selected period or filter is too narrow.");
    }

    if (!recommendation.length) {
        recommendation.push("Business performance is balanced. Maintain follow-up discipline and weekly closing rhythm.");
    }

    renderBulletList("aiSummaryList", summary);
    renderBulletList("aiRecommendationList", recommendation);
}

function getTopItem(data, field) {
    const map = {};

    data.forEach(item => {
        const key = item[field] || "Unknown";
        map[key] = (map[key] || 0) + 1;
    });

    const total = data.length || 1;

    const ranked = Object.entries(map)
        .map(([name, value]) => ({
            name,
            value,
            share: (value / total) * 100
        }))
        .sort((a, b) => b.value - a.value);

    return ranked[0] || {
        name: "-",
        value: 0,
        share: 0
    };
}

function renderBulletList(targetId, items) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.innerHTML = items
        .map(item => `<li>${item}</li>`)
        .join("");
}
function updateBusinessHealth(data) {
    const kpi = getKPIData(data);
    const topDealer = getTopItem(data, "dealer");
    const topProduct = getTopItem(data, "type");

    const salesScore = scoreByRange(kpi.units, 100, 70, 40);
    const coreProductScore = 90;

    let profitabilityScore = 50;
    if (kpi.gpPercent >= 12) profitabilityScore = 95;
    else if (kpi.gpPercent >= 10) profitabilityScore = 88;
    else if (kpi.gpPercent >= 8) profitabilityScore = 75;
    else if (kpi.gpPercent >= 5) profitabilityScore = 60;

    let dealerHealthScore = 95;
    if (topDealer.share > 75) dealerHealthScore = 55;
    else if (topDealer.share > 60) dealerHealthScore = 70;
    else if (topDealer.share > 50) dealerHealthScore = 82;

    let pipelineHealthScore = 80;
    if (data.length < 10) pipelineHealthScore = 50;
    else if (data.length < 30) pipelineHealthScore = 65;

    const businessHealthScore = Math.round(
        salesScore * 0.25 +
        coreProductScore * 0.20 +
        profitabilityScore * 0.20 +
        dealerHealthScore * 0.20 +
        pipelineHealthScore * 0.15
    );

    setScore("businessHealthScore", "businessHealthStatus", businessHealthScore);
    setScore("salesGrowthScore", "salesGrowthStatus", salesScore);
    setScore("coreProductScore", "coreProductStatus", coreProductScore);
    setScore("profitabilityScore", "profitabilityStatus", profitabilityScore);
    setScore("dealerHealthScore", "dealerHealthStatus", dealerHealthScore);
    setScore("pipelineHealthScore", "pipelineHealthStatus", pipelineHealthScore);
}

function scoreByRange(value, excellent, stable, watch) {
    if (value >= excellent) return 90;
    if (value >= stable) return 80;
    if (value >= watch) return 65;
    return 50;
}

function setScore(scoreId, statusId, score) {
    document.getElementById(scoreId).innerHTML = score;
    document.getElementById(statusId).innerHTML =
        getScoreEmoji(score) + " " + getScoreStatus(score);
}

function getScoreStatus(score) {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Strong";
    if (score >= 70) return "Stable";
    if (score >= 50) return "Watch";
    return "Critical";
}

function getScoreEmoji(score) {
    if (score >= 85) return "🟢";
    if (score >= 70) return "🟡";
    if (score >= 50) return "🟠";
    return "🔴";
}
function updatePipeline(data) {
    const units = data.length;

    const booking = Math.round(units * 1.35);
    const pipeline = Math.round(booking * 0.72);
    const ready = Math.round(pipeline * 0.55);
    const delivery = Math.round(ready * 0.42);

    document.getElementById("bookingFunnel").innerHTML = "Booking " + booking;
    document.getElementById("pipelineFunnel").innerHTML = "Pipeline " + pipeline;
    document.getElementById("readyFunnel").innerHTML = "Ready " + ready;
    document.getElementById("deliveryFunnel").innerHTML = "Delivery " + delivery;
}

function updateRiskAlert(data) {
    const kpi = getKPIData(data);
    const topDealer = getTopItem(data, "dealer");
    const topProduct = getTopItem(data, "type");

    const risks = [];

    if (kpi.gpPercent < 8) {
        risks.push("🔴 GP margin is below 8%. Review discount and pricing policy.");
    }

    if (topDealer.share > 60) {
        risks.push("🟠 Dealer concentration is high. Sales depend heavily on " + topDealer.name + ".");
    }

    if (topProduct.share > 70) {
        risks.push("🟡 Product mix is concentrated in " + topProduct.name + ".");
    }

    if (data.length < 10) {
        risks.push("🟠 Low sales volume in current filter. Check selected period.");
    }

    if (!risks.length) {
        risks.push("🟢 No critical risk detected from current filters.");
    }

    renderCardList("riskList", risks);
}

function updateQuickInsights(data) {
    const kpi = getKPIData(data);
    const topDealer = getTopItem(data, "dealer");
    const topProduct = getTopItem(data, "type");
    const topModel = getTopItem(data, "model");

    const insights = [
        "Top dealer: " + topDealer.name + " (" + topDealer.share.toFixed(1) + "%)",
        "Top product: " + topProduct.name,
        "Top model: " + topModel.name,
        "Average price: " + formatMoney(kpi.averagePrice)
    ];

    renderCardList("quickInsights", insights);
}

function renderCardList(targetId, items) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.innerHTML = items
        .map(item => `<div>${item}</div>`)
        .join("");
}