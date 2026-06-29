(function (window) {
  "use strict";

  function readSettings() {
    const auth = window.KMMSecurity.auth;
    const session = auth.readSession();
    if (!session) return null;
    return {
      company: session.company || "KMM",
      language: session.language || "en",
      role: session.role || "Viewer",
      theme: session.theme || "default",
      timeoutMinutes: Number(session.timeoutMinutes) || auth.DEFAULT_TIMEOUT_MINUTES,
      username: session.username || "",
      version: session.version || auth.VERSION
    };
  }

  function updateSettings(values) {
    const auth = window.KMMSecurity.auth;
    const session = auth.readSession();
    if (!session) return null;

    if (values.company) session.company = window.KMMSecurity.company.getCompany(values.company).code;
    if (values.language) session.language = values.language;
    if (values.theme) session.theme = values.theme;
    if (values.timeoutMinutes) session.timeoutMinutes = Number(values.timeoutMinutes);

    auth.writeSession(session);
    window.KMMSecurity.company.applyCompanyTheme();
    document.documentElement.dataset.theme = session.theme;
    return readSettings();
  }

  function bindSettingsPage() {
    const form = document.getElementById("settingsForm");
    if (!form) return;

    const settings = readSettings();
    if (!settings) return;

    document.getElementById("settingsTheme").value = settings.theme;
    document.getElementById("settingsCompany").value = settings.company;
    document.getElementById("settingsTimeout").value = String(settings.timeoutMinutes);
    document.getElementById("settingsLanguage").value = settings.language;
    document.getElementById("settingsRole").value = settings.role;
    document.getElementById("settingsVersion").value = settings.version;

    form.addEventListener("submit", event => {
      event.preventDefault();
      updateSettings({
        company: document.getElementById("settingsCompany").value,
        language: document.getElementById("settingsLanguage").value,
        theme: document.getElementById("settingsTheme").value,
        timeoutMinutes: document.getElementById("settingsTimeout").value
      });

      const status = document.getElementById("settingsStatus");
      if (status) {
        status.textContent = "Settings saved for this session.";
      }
    });
  }

  window.KMMSecurity = window.KMMSecurity || {};
  window.KMMSecurity.settings = {
    bindSettingsPage,
    readSettings,
    updateSettings
  };
})(window);
