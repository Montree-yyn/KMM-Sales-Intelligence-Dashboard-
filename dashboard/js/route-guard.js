(function (window, document) {
  "use strict";

  const LOGIN_PAGE = "login.html";
  const ACTIVITY_EVENTS = ["click", "keydown", "mousemove", "scroll", "touchstart"];

  function redirectToLogin(reason) {
    window.KMMSecurity.auth.clearSession(reason);
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== LOGIN_PAGE) {
      window.location.href = LOGIN_PAGE;
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
    const header = document.querySelector(".page-head, .topbar");
    if (!header || document.getElementById("securityBar")) return;

    const company = window.KMMSecurity.company.getSelectedCompany();
    const bar = document.createElement("div");
    bar.id = "securityBar";
    bar.className = "security-bar";
    bar.innerHTML = `
      <label class="security-company">
        <span>Company</span>
        <select id="companySelector" aria-label="Company selector">
          ${window.KMMSecurity.company.getCompanies().map(item => option(item.code, item.code, company.code)).join("")}
        </select>
      </label>
      <a class="security-settings" href="settings.html">Settings</a>
      <button type="button" id="logoutButton" class="security-profile" aria-label="Logout">
        <span>${session.role}</span>
        <strong>${session.username}</strong>
      </button>
    `;
    header.appendChild(bar);

    document.getElementById("companySelector").addEventListener("change", event => {
      window.KMMSecurity.company.setSelectedCompany(event.target.value);
    });

    document.getElementById("logoutButton").addEventListener("click", () => {
      redirectToLogin("logout");
    });
  }

  function showSessionExpiredDialogIfNeeded() {
    if (window.KMMSecurity.auth.getLogoutReason() !== "expired") return;
    const dialog = document.getElementById("sessionExpiredDialog");
    if (dialog && typeof dialog.showModal === "function") {
      dialog.showModal();
      return;
    }
    window.alert("Session expired. Please log in again.");
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
    renderSecurityBar(session);
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
