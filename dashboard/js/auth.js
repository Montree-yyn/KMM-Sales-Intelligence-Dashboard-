(function (window) {
  "use strict";

  const SESSION_KEY = "kmm.security.session";
  const DEFAULT_TIMEOUT_MINUTES = 15;
  const VERSION = "V8.1-V9 Security Platform";

  const ROLE_BY_USERNAME = {
    superadmin: "SuperAdmin",
    executive: "Executive",
    manager: "Manager",
    sales: "Sales",
    viewer: "Viewer"
  };

  function now() {
    return Date.now();
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      clearSession();
      return null;
    }
  }

  function writeSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession(reason) {
    sessionStorage.removeItem(SESSION_KEY);
    if (reason) {
      sessionStorage.setItem("kmm.security.logoutReason", reason);
    }
  }

  function normalizeRole(role) {
    const validRoles = ["SuperAdmin", "Executive", "Manager", "Sales", "Viewer"];
    return validRoles.includes(role) ? role : "Viewer";
  }

  function createSession(username, options) {
    const cleanUser = String(username || "").trim();
    if (!cleanUser) {
      throw new Error("Username is required.");
    }

    const selectedOptions = options || {};
    const role = normalizeRole(selectedOptions.role || ROLE_BY_USERNAME[cleanUser.toLowerCase()] || "Viewer");
    const timeoutMinutes = Number(selectedOptions.timeoutMinutes) || DEFAULT_TIMEOUT_MINUTES;
    const timestamp = now();

    const session = {
      username: cleanUser,
      role,
      company: selectedOptions.company || "KMM",
      theme: selectedOptions.theme || "default",
      language: selectedOptions.language || "en",
      timeoutMinutes,
      loginAt: timestamp,
      lastActivityAt: timestamp,
      version: VERSION
    };

    writeSession(session);
    return session;
  }

  function touchSession() {
    const session = readSession();
    if (!session) return null;
    session.lastActivityAt = now();
    writeSession(session);
    return session;
  }

  function isExpired(session) {
    if (!session) return true;
    const timeoutMinutes = Number(session.timeoutMinutes) || DEFAULT_TIMEOUT_MINUTES;
    return now() - Number(session.lastActivityAt || 0) > timeoutMinutes * 60 * 1000;
  }

  function getLogoutReason() {
    const reason = sessionStorage.getItem("kmm.security.logoutReason");
    sessionStorage.removeItem("kmm.security.logoutReason");
    return reason;
  }

  window.KMMSecurity = window.KMMSecurity || {};
  window.KMMSecurity.auth = {
    SESSION_KEY,
    DEFAULT_TIMEOUT_MINUTES,
    VERSION,
    clearSession,
    createSession,
    getLogoutReason,
    isExpired,
    readSession,
    touchSession,
    writeSession
  };
})(window);
