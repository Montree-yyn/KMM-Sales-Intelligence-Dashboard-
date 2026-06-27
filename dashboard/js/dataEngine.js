// ===============================
// Data Engine V3
// ===============================

let dashboardData = [];

// โหลดข้อมูล JSON
async function loadDashboardData() {

    const response = await fetch("data/dashboard_data.json");

    const rawData = await response.json();
    dashboardData = normalizeDashboardData(rawData);

    console.log("Loaded records :", dashboardData.length);

    return dashboardData;

}

// จำนวน Record
function getRecordCount() {

    return dashboardData.length;

}

// Last Refresh

function getLastRefresh() {

    const now = new Date();

    return now.toLocaleDateString("en-GB") +
        " " +
        now.toLocaleTimeString("en-GB");

}
function getKPIData(data = getCoreProductData()) {
    const units = data.length;

    const salesValue = data.reduce((sum, item) => {
        return sum + Number(item.msrp || item.salesValue || 0);
    }, 0);

    const grossProfit = data.reduce((sum, item) => {
        return sum + Number(item.gp1 || item.grossProfit || 0);
    }, 0);

    const gpPercent = salesValue > 0
        ? (grossProfit / salesValue) * 100
        : 0;

    const averagePrice = units > 0
        ? salesValue / units
        : 0;

    return {
        units,
        salesValue,
        grossProfit,
        gpPercent,
        averagePrice
    };
}

function formatMoney(value) {
    const number = Number(value || 0);

    if (number >= 1000000000) {
        return (number / 1000000000).toFixed(1) + "B";
    }

    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + "M";
    }

    if (number >= 1000) {
        return (number / 1000).toFixed(1) + "K";
    }

    return number.toLocaleString();
}
const PRODUCT_TYPE_MAP = {
    "TT": "Tractor (TT)",
    "TRACTOR": "Tractor (TT)",
    "TRACTOR (TT)": "Tractor (TT)",

    "CH": "Combine Harvester (CH)",
    "COMBINE": "Combine Harvester (CH)",
    "COMBINE HARVESTER": "Combine Harvester (CH)",
    "COMBINE HARVESTER (CH)": "Combine Harvester (CH)",

    "EX": "Excavator (EX)",
    "EXCAVATOR": "Excavator (EX)",
    "EXCAVATOR (EX)": "Excavator (EX)",

    "TP": "Transplanter (TP)",
    "POWER TILLER": "Transplanter (TP)",
    "POWER TILLER (TP)": "Transplanter (TP)",
    "TRANSPLANTER": "Transplanter (TP)",
    "TRANSPLANTER (TP)": "Transplanter (TP)",

    "TX": "Used Tractor (TX)",
    "USED": "Used Tractor (TX)",
    "USED TRACTOR": "Used Tractor (TX)",
    "USED TRACTOR (TX)": "Used Tractor (TX)",

    "IM": "Implement (IM)",
    "IMPLEMENT": "Implement (IM)",

    "OT": "Other (OT)",
    "OTHER": "Other (OT)"
};

const CORE_PRODUCT_TYPES = [
    "Tractor (TT)",
    "Combine Harvester (CH)",
    "Excavator (EX)",
    "Transplanter (TP)",
    "Used Tractor (TX)"
];

function normalizeProductType(type) {
    const key = String(type || "").trim().toUpperCase();
    return PRODUCT_TYPE_MAP[key] || String(type || "").trim();
}

function normalizeDashboardData(data) {
    return data.map(item => ({
        ...item,
        type: normalizeProductType(item.type)
    }));
}

function getCoreProductData(data = dashboardData) {
    return data.filter(item => CORE_PRODUCT_TYPES.includes(item.type));
}
function getWeekNo(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : null;
}

function getUniqueValues(data, key) {
    return [...new Set(
        data.map(item => item[key]).filter(Boolean)
    )];
}

function getFilteredData() {
    const year = document.getElementById("yearFilter").value;
    const month = document.getElementById("monthFilter").value;
    const week = document.getElementById("weekFilter").value;
    const dealer = document.getElementById("dealerFilter").value;
    const type = document.getElementById("typeFilter").value;

    return getCoreProductData().filter(item => {
        const matchYear = !year || String(item.year) === String(year);
        const matchMonth = !month || String(item.month) === String(month);
        const matchWeek = !week || getWeekNo(item.week) === getWeekNo(week);
        const matchDealer = !dealer || String(item.dealer) === String(dealer);
        const matchType = !type || String(item.type) === String(type);

        return matchYear && matchMonth && matchWeek && matchDealer && matchType;
    });
}