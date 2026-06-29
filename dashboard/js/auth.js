(function (window) {
  "use strict";

  const SESSION_KEY = "kmm.security.session";
  const DEFAULT_TIMEOUT_MINUTES = 15;
  const VERSION = "V10 Production Release";

  // V10 temporary protection only: static local credentials protect casual
  // access in GitHub Pages, but they are visible in browser source and must be
  // replaced by real identity-provider or server-side authentication in V11.
  const LOCAL_USERS = {
    superadmin: { password: "KMM@2026!", role: "SuperAdmin" },
    executive: { password: "Exec@2026", role: "Executive" },
    manager: { password: "Manager@2026", role: "Manager" },
    sales: { password: "Sales@2026", role: "Sales" },
    viewer: { password: "Viewer@2026", role: "Viewer" }
  };

  function now() {
    return Date.now();
  }

  function translate(key) {
    return window.KMMI18n ? window.KMMI18n.t(key) : key;
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
      throw new Error(translate("error.usernameRequired"));
    }

    const selectedOptions = options || {};
    const role = normalizeRole(selectedOptions.role || "Viewer");
    const timeoutMinutes = Number(selectedOptions.timeoutMinutes) || DEFAULT_TIMEOUT_MINUTES;
    const timestamp = now();

    const session = {
      username: cleanUser,
      role,
      company: selectedOptions.company || "KMM",
      theme: selectedOptions.theme || "default",
      language: selectedOptions.language || (window.KMMI18n ? window.KMMI18n.getLanguage() : "th"),
      timeoutMinutes,
      loginAt: timestamp,
      lastActivityAt: timestamp,
      version: VERSION
    };

    writeSession(session);
    return session;
  }

  function authenticate(username, password, options) {
    const cleanUser = String(username || "").trim();
    const suppliedPassword = String(password || "");

    if (!cleanUser) {
      return { ok: false, error: translate("error.usernameRequired") };
    }

    if (!suppliedPassword) {
      return { ok: false, error: translate("error.passwordRequired") };
    }

    const user = LOCAL_USERS[cleanUser.toLowerCase()];
    if (!user) {
      return { ok: false, error: translate("error.usernameNotFound") };
    }

    if (suppliedPassword !== user.password) {
      return { ok: false, error: translate("error.passwordIncorrect") };
    }

    const session = createSession(cleanUser, Object.assign({}, options, { role: user.role }));
    return { ok: true, session };
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
    authenticate,
    clearSession,
    getLogoutReason,
    isExpired,
    readSession,
    touchSession,
    writeSession
  };
})(window);
