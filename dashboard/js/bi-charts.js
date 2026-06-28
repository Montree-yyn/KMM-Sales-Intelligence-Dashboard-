(function (window) {
  "use strict";

  const BI = window.BI || {};
  const state = BI.state || { charts: {} };

  const palette = ["#ff5a00", "#222b3f", "#12b89d", "#ffb000", "#7a8599", "#d6dbe3"];

  function cssVar(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function gradient(ctx, color = cssVar("--bi-orange", "#ff5a00"), alpha = 0.18) {
    const chart = ctx.chart;
    const area = chart.chartArea;
    if (!area) return color;
    const grad = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    grad.addColorStop(0, hexToRgba(color, alpha));
    grad.addColorStop(1, hexToRgba(color, 0.02));
    return grad;
  }

  function hexToRgba(hex, alpha) {
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function tooltipLabel(context) {
    const label = context.dataset.label ? context.dataset.label + ": " : "";
    const raw = context.raw;
    if (raw && typeof raw === "object" && "name" in raw) return `${raw.name}: ${raw.x} units / GP ${Number(raw.y || 0).toFixed(1)}%`;
    if (typeof context.parsed?.y === "number") return label + context.parsed.y.toLocaleString();
    if (typeof context.parsed === "number") return label + context.parsed.toLocaleString();
    return label + context.formattedValue;
  }

  function commonOptions(extra = {}) {
    return deepMerge({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 850,
        easing: "easeOutQuart"
      },
      interaction: {
        intersect: false,
        mode: "index"
      },
      plugins: {
        legend: {
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: cssVar("--bi-muted", "#667085"),
            font: {
              family: cssVar("--bi-font", "Inter, sans-serif"),
              size: 12,
              weight: "800"
            },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: "rgba(21, 27, 45, 0.94)",
          borderColor: "rgba(255, 255, 255, 0.14)",
          borderWidth: 1,
          cornerRadius: 12,
          displayColors: true,
          padding: 12,
          titleFont: { family: cssVar("--bi-font", "Inter, sans-serif"), weight: "900" },
          bodyFont: { family: cssVar("--bi-font", "Inter, sans-serif"), weight: "700" },
          callbacks: { label: tooltipLabel }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: cssVar("--bi-muted", "#667085"),
            font: { family: cssVar("--bi-font", "Inter, sans-serif"), size: 11, weight: "800" }
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(102, 112, 133, 0.14)" },
          border: { display: false },
          ticks: {
            color: cssVar("--bi-muted", "#667085"),
            font: { family: cssVar("--bi-font", "Inter, sans-serif"), size: 11, weight: "800" }
          }
        }
      }
    }, extra);
  }

  function enhanceDataset(dataset, index, type) {
    const color = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[index % dataset.backgroundColor.length] : dataset.borderColor || dataset.backgroundColor || palette[index % palette.length];
    const next = { ...dataset };

    if (type === "bar") {
      next.borderRadius = next.borderRadius ?? 10;
      next.borderSkipped = next.borderSkipped ?? false;
      next.backgroundColor = next.backgroundColor || color;
      next.hoverBackgroundColor = next.hoverBackgroundColor || cssVar("--bi-orange-2", "#ff7a18");
    }

    if (type === "line") {
      next.borderWidth = next.borderWidth ?? 3;
      next.pointRadius = next.pointRadius ?? 3;
      next.pointHoverRadius = next.pointHoverRadius ?? 6;
      next.tension = next.tension ?? 0.35;
      if (next.fill && !next.backgroundColor) next.backgroundColor = gradient;
    }

    if (type === "doughnut") {
      next.borderColor = next.borderColor || "#ffffff";
      next.borderWidth = next.borderWidth ?? 5;
      next.borderRadius = next.borderRadius ?? 10;
      next.spacing = next.spacing ?? 3;
    }

    return next;
  }

  function normalizeConfig(config) {
    const type = config.type;
    const data = {
      ...config.data,
      datasets: (config.data?.datasets || []).map((dataset, index) => enhanceDataset(dataset, index, type))
    };
    const options = deepMerge(commonOptions(), config.options || {});

    if (type === "doughnut") {
      delete options.scales;
      options.cutout = options.cutout || "62%";
    }

    if (type === "radar" || type === "bubble" || type === "scatter") {
      options.interaction = { intersect: true, mode: "nearest" };
    }

    return { ...config, data, options };
  }

  function renderChart(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === "undefined") return null;
    if (state.charts[id]) state.charts[id].destroy();
    state.charts[id] = new Chart(canvas, normalizeConfig(config));
    return state.charts[id];
  }

  function deepMerge(target, source) {
    const output = { ...target };
    Object.keys(source || {}).forEach((key) => {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) && !(source[key] instanceof Function)) {
        output[key] = deepMerge(output[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    });
    return output;
  }

  BI.state = state;
  BI.charts = {
    palette,
    commonOptions,
    renderChart,
    normalizeConfig,
    gradient
  };

  window.BI = BI;
})(window);
