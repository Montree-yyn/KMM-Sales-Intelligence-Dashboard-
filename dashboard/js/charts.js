let weeklyTrendChart = null;

function renderWeeklyTrendChart(data) {
    const canvas = document.getElementById("weeklyTrendChart");
    if (!canvas) return;

    const weeklyData = {};

    data.forEach(item => {
        const weekNo = getWeekNo(item.week);
        if (!weekNo) return;

        const key = "W" + String(weekNo).padStart(2, "0");
        weeklyData[key] = (weeklyData[key] || 0) + 1;
    });

    const labels = Object.keys(weeklyData)
        .sort((a, b) => getWeekNo(a) - getWeekNo(b))
        .slice(-12);

    const values = labels.map(week => weeklyData[week]);

    if (weeklyTrendChart) weeklyTrendChart.destroy();

    weeklyTrendChart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Sales Units",
                data: values,
                borderColor: "#ff6f00",
                backgroundColor: "rgba(255,111,0,0.14)",
                borderWidth: 3,
                pointRadius: 4,
                tension: 0.35,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}
let productMixChart = null;

function renderProductMixChart(data) {
    const canvas = document.getElementById("productMixChart");
    if (!canvas) return;

    const productData = {};

    data.forEach(item => {
        const type = item.type || "Unknown";
        productData[type] = (productData[type] || 0) + 1;
    });

    const labels = Object.keys(productData);
    const values = labels.map(type => productData[type]);

    if (productMixChart) productMixChart.destroy();

    productMixChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#ff6f00",
                    "#13b99a",
                    "#2563eb",
                    "#16a34a",
                    "#f59e0b"
                ],
                borderColor: "#ffffff",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}