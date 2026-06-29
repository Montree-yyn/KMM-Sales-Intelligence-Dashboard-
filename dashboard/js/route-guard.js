(function (window, document) {
  "use strict";

  const LOGIN_PAGE = "login.html";
  const ACTIVITY_EVENTS = ["click", "keydown", "mousemove", "scroll", "touchstart"];

  function t(key) {
    return window.KMMI18n ? window.KMMI18n.t(key) : key;
  }

  function redirectToLogin(reason) {
    window.KMMSecurity.auth.clearSession(reason);
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== LOGIN_PAGE) {
      const requestedPath = currentPage + window.location.search + window.location.hash;
      window.location.href = `${LOGIN_PAGE}?returnTo=${encodeURIComponent(requestedPath)}`;
    }
  }

  function ensureAccess() {
    const auth = window.KMMSecurity.auth;
    const permission = window.KMMSecurity.permission;
    const session = auth.readSession();

    if (!session) {
      redirectToLogin("login-required");
      return null;
    }

    if (auth.isExpired(session)) {
      redirectToLogin("expired");
      return null;
    }

    if (!permission.canAccessPath(session.role, window.location.pathname)) {
      redirectToLogin("forbidden");
      return null;
    }

    auth.touchSession();
    return auth.readSession();
  }

  function option(value, label, selectedValue) {
    return `<option value="${value}"${value === selectedValue ? " selected" : ""}>${label}</option>`;
  }

  function renderSecurityBar(session) {
    if (!session) return;
    const header = document.querySelector(".page-head, .topbar");
    if (!header || document.getElementById("securityBar")) return;

    const company = window.KMMSecurity.company.getSelectedCompany();
    const language = window.KMMI18n ? window.KMMI18n.getLanguage() : (session.language || "th");
    const bar = document.createElement("div");
    bar.id = "securityBar";
    bar.className = "security-bar";
    bar.innerHTML = `
      <label class="security-company">
        <span data-i18n="security.company">Company</span>
        <select id="companySelector" data-i18n-aria="security.companySelector" aria-label="Company selector">
          ${window.KMMSecurity.company.getCompanies().map(item => option(item.code, window.KMMSecurity.company.getCompanyLabel(item.code), company.code)).join("")}
        </select>
      </label>
      <label class="security-company">
        <span data-i18n="language">Language</span>
        <select id="languageSelector" data-i18n-aria="language" aria-label="Language">
          ${option("th", t("lang.th"), language)}
          ${option("en", t("lang.en"), language)}
        </select>
      </label>
      <a class="security-settings" href="settings.html" data-i18n="security.settings">Settings</a>
      <button type="button" id="logoutButton" class="security-profile" data-i18n-aria="security.logout" aria-label="Logout">
        <span>${t(`role.${session.role}`)}</span>
        <strong>${session.username}</strong>
      </button>
    `;
    header.appendChild(bar);
    if (window.KMMI18n) window.KMMI18n.applyTranslations(bar);

    document.getElementById("companySelector").addEventListener("change", event => {
      window.KMMSecurity.company.setSelectedCompany(event.target.value);
      const currentSession = window.KMMSecurity.auth.readSession();
      if (currentSession) {
        renderSecurityBar(currentSession);
      }
    });

    document.getElementById("languageSelector").addEventListener("change", event => {
      const selected = window.KMMI18n ? window.KMMI18n.setLanguage(event.target.value) : event.target.value;
      const currentSession = window.KMMSecurity.auth.readSession();
      if (currentSession) {
        currentSession.language = selected;
        window.KMMSecurity.auth.writeSession(currentSession);
      }
      event.target.value = selected;
    });

    document.getElementById("logoutButton").addEventListener("click", () => {
      redirectToLogin("logout");
    });
  }

  function keepSecurityBarMounted(session) {
    renderSecurityBar(session);
    window.setTimeout(() => renderSecurityBar(window.KMMSecurity.auth.readSession()), 0);
    window.addEventListener("load", () => renderSecurityBar(window.KMMSecurity.auth.readSession()));

    const observer = new MutationObserver(() => {
      const currentSession = window.KMMSecurity.auth.readSession();
      if (!currentSession || document.getElementById("securityBar")) return;
      renderSecurityBar(currentSession);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function showSessionExpiredDialogIfNeeded() {
    if (window.KMMSecurity.auth.getLogoutReason() !== "expired") return;
    const dialog = document.getElementById("sessionExpiredDialog");
    if (dialog && typeof dialog.showModal === "function") {
      dialog.showModal();
      return;
    }
    window.alert(t("error.sessionExpired"));
  }

  function bindActivityTracking() {
    let lastTouch = 0;
    ACTIVITY_EVENTS.forEach(eventName => {
      document.addEventListener(eventName, () => {
        const auth = window.KMMSecurity.auth;
        const session = auth.readSession();
        const currentTime = Date.now();
        if (!session || currentTime - lastTouch < 1000) return;
        lastTouch = currentTime;
        if (auth.isExpired(session)) {
          redirectToLogin("expired");
          return;
        }
        auth.touchSession();
      }, { passive: true });
    });

    window.setInterval(() => {
      const session = window.KMMSecurity.auth.readSession();
      if (session && window.KMMSecurity.auth.isExpired(session)) {
        redirectToLogin("expired");
      }
    }, 30000);
  }

  function init() {
    const page = window.location.pathname.split("/").pop();
    if (page === LOGIN_PAGE) {
      showSessionExpiredDialogIfNeeded();
      return;
    }

    const session = ensureAccess();
    if (!session) return;
    window.KMMSecurity.company.applyCompanyTheme();
    document.documentElement.dataset.theme = session.theme || "default";
    keepSecurityBarMounted(session);
    bindActivityTracking();
  }

  window.KMMSecurity = window.KMMSecurity || {};
  window.KMMSecurity.routeGuard = {
    ensureAccess,
    init,
    redirectToLogin
  };

  document.addEventListener("DOMContentLoaded", init);
})(window, document);
