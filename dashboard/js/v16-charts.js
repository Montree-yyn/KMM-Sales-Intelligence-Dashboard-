(function (window) {
  "use strict";

  const COLORS = {
    orange: "#FF6200",
    orangeSoft: "rgba(255, 98, 0, 0.12)",
    charcoal: "#252A34",
    gray: "#A8AFB8",
    pale: "#E8EBF0",
    green: "#16A34A",
    red: "#E5482E"
  };

  const instances = {};

  function baseOptions(options) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { boxWidth: 8, boxHeight: 8, color: COLORS.charcoal, usePointStyle: true, font: { size: 11, weight: "600" } }
        },
        tooltip: {
          backgroundColor: COLORS.charcoal,
          titleColor: "#fff",
          bodyColor: "#fff",
          displayColors: false,
          padding: 10
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#596171", font: { size: 11 } } },
        y: { beginAtZero: true, grid: { color: "#ECEFF3", drawBorder: false }, ticks: { color: "#596171", font: { size: 11 } } }
      }
    }, options || {});
  }

  function render(id, type, data, options) {
    const canvas = document.getElementById(id);
    if (!canvas || !window.Chart) return null;
    if (instances[id]) instances[id].destroy();
    instances[id] = new window.Chart(canvas, { type, data, options: baseOptions(options) });
    return instances[id];
  }

  function salesTrend(id, labels, sales, target) {
    const datasets = [
      { label: "Sales", data: sales, borderColor: COLORS.orange, backgroundColor: COLORS.orangeSoft, pointBackgroundColor: COLORS.orange, pointRadius: 4, borderWidth: 3, fill: true, tension: 0.38 }
    ];
    if (Array.isArray(target) && target.some(value => Number(value) > 0)) {
      datasets.push({ label: "Compare", data: target, borderColor: COLORS.gray, pointRadius: 0, borderWidth: 2, borderDash: [5, 5], fill: false, tension: 0.38 });
    }
    return render(id, "line", {
      labels,
      datasets
    }, { plugins: { legend: { display: true, position: "top" } } });
  }

  function bookingDelivery(id, labels, booking, delivery) {
    return render(id, "bar", {
      labels,
      datasets: [
        { label: "Sales Units", data: booking, backgroundColor: COLORS.orange, borderRadius: 8, maxBarThickness: 22 },
        { label: "Profitable Units", data: delivery, backgroundColor: COLORS.gray, borderRadius: 8, maxBarThickness: 22 }
      ]
    }, { plugins: { legend: { display: true, position: "top" } } });
  }

  function horizontalBar(id, labels, values, label) {
    return render(id, "bar", {
      labels,
      datasets: [{ label: label || "Units", data: values, backgroundColor: COLORS.orange, borderRadius: 8, maxBarThickness: 18 }]
    }, {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: "#ECEFF3", drawBorder: false }, ticks: { color: "#596171", font: { size: 11 } } },
        y: { grid: { display: false }, ticks: { color: "#596171", font: { size: 11 } } }
      }
    });
  }

  function salesTarget(id, labels, sales, target) {
    const datasets = [
      { type: "bar", label: "Sales", data: sales, backgroundColor: COLORS.orange, borderRadius: 8, maxBarThickness: 22 }
    ];
    if (Array.isArray(target) && target.some(value => Number(value) > 0)) {
      datasets.push({ type: "line", label: "Target", data: target, borderColor: COLORS.charcoal, pointRadius: 3, borderWidth: 2, tension: 0.32 });
    }
    return render(id, "bar", { labels, datasets }, { plugins: { legend: { display: true, position: "top" } } });
  }

  function doughnut(id, labels, values) {
    return render(id, "doughnut", {
      labels,
      datasets: [{ data: values, backgroundColor: [COLORS.orange, COLORS.gray, "#D9DEE5"], borderWidth: 0, cutout: "68%" }]
    }, { scales: {}, plugins: { legend: { display: false } } });
  }

  function simpleBar(id, labels, values, label) {
    return render(id, "bar", {
      labels,
      datasets: [{ label: label || "Records", data: values, backgroundColor: COLORS.orange, borderRadius: 8, maxBarThickness: 24 }]
    }, { plugins: { legend: { display: false } } });
  }

  window.V16Charts = { COLORS, bookingDelivery, doughnut, horizontalBar, instances, salesTarget, salesTrend, simpleBar };
})(window);
