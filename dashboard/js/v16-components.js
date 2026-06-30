(function (window) {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function attr(value) {
    return escapeHtml(value);
  }

  function icon(name) {
    const icons = {
      focus: '<path d="M3 12h18"/><path d="M12 3v18"/><circle cx="12" cy="12" r="4"/>',
      sales: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/>',
      market: '<path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>',
      stock: '<path d="m21 16-9 5-9-5"/><path d="m21 12-9 5-9-5"/><path d="m21 8-9 5-9-5 9-5 9 5Z"/>',
      team: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
      settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
      cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h8.72a2 2 0 0 0 2-1.58l1.65-7.43H5.12"/>',
      booking: '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
      delivery: '<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-5l-3-5h-5v10h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
      landing: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
      collection: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h2"/><path d="M11 15h5"/>',
      forecast: '<path d="M3 3v18h18"/><path d="m7 14 3-3 3 3 5-7"/><path d="M18 7h-4"/><path d="M18 7v4"/>',
      health: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/>',
      target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
      search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
      refresh: '<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M16 8h5V3"/>',
      calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
      export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
      chevron: '<path d="m9 18 6-6-6-6"/>'
    };
    const path = icons[name] || icons.chevron;
    return `<svg class="v16-icon" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  }

  function t(key, defaultText) {
    return window.V16Lang?.t?.(key, defaultText) || defaultText || key;
  }

  function progress(value, status) {
    const width = Math.max(0, Math.min(100, Number(value) || 0));
    return `<div class="v16-progress" aria-hidden="true"><div class="v16-progress-fill ${attr(status || "")}" style="width:${width}%"></div></div>`;
  }

  function nav(items, activeKey) {
    return `<nav class="v16-nav" aria-label="Dashboard navigation">${items.map(item => `
      <a href="${attr(item.href)}" class="${item.key === activeKey ? "is-active" : ""}">
        <span class="v16-nav-icon">${icon(item.icon || item.key)}</span>
        <strong>${escapeHtml(t(`nav.${item.key}`, item.label))}</strong>
      </a>
    `).join("")}</nav>`;
  }

  function sidebar(config) {
    return `
      <aside class="v16-sidebar">
        <div class="v16-brand">
          <div class="v16-brand-mark">KMM</div>
          <strong>KUBOTA MAESOD MYANMAR</strong>
        </div>
        ${nav(config.navItems || [], config.activeKey)}
        <section class="v16-side-health" aria-label="Sales Health Score">
          <h2>${escapeHtml(t("kpi.salesHealthScore", "Sales Health Score"))}</h2>
          <div class="v16-side-gauge" style="--score:92%">
            <div><strong id="sideMissionScore">92</strong><span>/100</span></div>
          </div>
          <p id="sideHealthStatus">Excellent</p>
          <footer><span>${escapeHtml(t("common.updated", "Updated"))}: <strong id="lastUpdatedSide">--:--</strong></span><button type="button" data-action="refresh" aria-label="${escapeHtml(t("filter.refresh", "Refresh"))}" title="${escapeHtml(t("filter.refresh", "Refresh"))}">${icon("refresh")}</button></footer>
        </section>
        <div class="v16-side-foot">
          <span>${escapeHtml(t("app.version", "Version 16 Enterprise"))}</span>
          <div class="v16-user">
            <div class="v16-avatar" id="userAvatar">M</div>
            <div><strong id="userName">Montree C.</strong><span id="userRole">Sales Division Manager</span></div>
          </div>
        </div>
      </aside>
    `;
  }

  function field(key, label, options) {
    const isDate = key === "dateRange";
    return `
      <label class="v16-field">
        <span>${escapeHtml(label)}</span>
        <select data-filter="${attr(key)}" aria-label="${escapeHtml(label)}">${options || ""}</select>
        <i>${icon(isDate ? "calendar" : "chevron")}</i>
      </label>
    `;
  }

  function filterBar(filters, config) {
    const fields = [
      ["dealer", t("filter.dealer", "Dealer")],
      ["year", t("filter.year", "Year")],
      ["month", t("filter.month", "Month")],
      ["week", t("filter.week", "Week")],
      ["comparePeriod", t("filter.compare", "Compare")]
    ];
    return `
      <section class="v16-filter-bar" aria-label="Global filters">
        ${fields.map(([key, label]) => field(key, label, filters?.[key] || "")).join("")}
        <button type="button" class="v16-tool-button" data-action="refresh" aria-label="${escapeHtml(t("filter.refresh", "Refresh"))}" title="${escapeHtml(t("filter.refresh", "Refresh"))}">${icon("refresh")}</button>
      </section>
    `;
  }

  function header(config) {
    return `
      <header class="v16-header topbar">
        <div class="v16-title-block">
          <h1>${escapeHtml(config.pageTitle || "Focus Dashboard")}</h1>
          <p>${escapeHtml(config.pageSubtitle || "Sales Command Center")}</p>
        </div>
        <div class="v16-header-controls">
          <label class="v16-search"><span>${icon("search")}</span><input id="globalSearch" type="search" placeholder="${escapeHtml(t("common.search", "Search"))}"></label>
          <label class="v16-language"><span>${escapeHtml(t("common.language", "Language"))}</span><select id="v16LanguageSwitcher" aria-label="${escapeHtml(t("common.language", "Language"))}">
            <option value="en">English</option>
            <option value="th">ไทย</option>
            <option value="my">မြန်မာ</option>
          </select></label>
          <button type="button" class="v16-tool-button" data-action="refresh" aria-label="${escapeHtml(t("filter.refresh", "Refresh"))}" title="${escapeHtml(t("filter.refresh", "Refresh"))}">${icon("refresh")}</button>
          <button type="button" class="v16-tool-button v16-notification" aria-label="${escapeHtml(t("common.notifications", "Notifications"))}" title="${escapeHtml(t("common.notifications", "Notifications"))}">${icon("bell")}<b>3</b></button>
          <div class="v16-profile">
            <div class="v16-avatar photo" id="userAvatarHeader">M</div>
            <div><strong id="userNameHeader">Montree C.</strong><span id="userRoleHeader">Sales Division Manager</span></div>
            <i>${icon("chevron")}</i>
          </div>
        </div>
      </header>
    `;
  }

  function shell(config) {
    return `
      <div class="v16-app">
        ${sidebar(config)}
        <main class="v16-main">
          <div class="v16-workspace">
            ${header(config)}
            ${filterBar(config.filters || {}, config)}
            <div id="focusContent" class="v16-content"></div>
          </div>
        </main>
      </div>
    `;
  }

  function panel(title, body, className, action) {
    return `
      <article class="v16-panel ${attr(className || "")}">
        <div class="v16-panel-head"><h3>${escapeHtml(title)}</h3>${action || ""}</div>
        ${body || ""}
      </article>
    `;
  }

  function kpi(item) {
    const spark = Array.isArray(item.sparkline) && item.sparkline.length
      ? item.sparkline.map((value, index) => `<i style="height:${Math.max(12, Math.min(100, Number(value) || 0))}%" aria-hidden="true"></i>`).join("")
      : "";
    return `
      <article class="v16-kpi-card">
        <div class="v16-kpi-top"><span>${icon(item.icon)}</span><i>${icon("chevron")}</i></div>
        <p>${escapeHtml(item.title)}</p>
        <strong>${escapeHtml(item.valueText)}</strong>
        <small>${escapeHtml(t("common.target", "Target"))}: ${escapeHtml(item.targetText || t("common.dataNotAvailable", "Data not available"))}</small>
        <div class="v16-sparkline">${spark}</div>
        <small>${escapeHtml(item.meta || "")}</small>
        <em class="${attr(item.status || "")}">${escapeHtml(item.achievementText || "")}</em>
      </article>
    `;
  }

  function empty(label) {
    return `<div class="v16-empty">${escapeHtml(label || t("common.dataNotAvailable", "Data not available"))}</div>`;
  }

  window.V16Components = {
    empty,
    escapeHtml,
    icon,
    kpi,
    panel,
    progress,
    shell,
    t
  };
})(window);
