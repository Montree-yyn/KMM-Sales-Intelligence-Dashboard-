(function (window) {
  "use strict";

  function readSettings() {
    const auth = window.KMMSecurity.auth;
    const session = auth.readSession();
    if (!session) return null;
    return {
      company: session.company || "KMM",
      language: window.KMMI18n ? window.KMMI18n.getLanguage() : (session.language || "th"),
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
    if (values.language) {
      session.language = window.KMMI18n ? window.KMMI18n.setLanguage(values.language) : values.language;
    }
    if (values.theme) session.theme = values.theme;
    if (values.timeoutMinutes) session.timeoutMinutes = Number(values.timeoutMinutes);

    auth.writeSession(session);
    window.KMMSecurity.company.applyCompanyTheme();
    document.documentElement.dataset.theme = session.theme;
    if (window.KMMI18n) window.KMMI18n.applyTranslations(document);
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
    document.getElementById("settingsUsername").value = settings.username;
    document.getElementById("settingsRole").value = window.KMMI18n ? window.KMMI18n.t(`role.${settings.role}`) : settings.role;
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
        status.textContent = window.KMMI18n ? window.KMMI18n.t("settings.saved") : "Settings saved for this session.";
      }
    });

    document.getElementById("settingsLanguage").addEventListener("change", event => {
      const selected = window.KMMI18n ? window.KMMI18n.setLanguage(event.target.value) : event.target.value;
      const role = document.getElementById("settingsRole");
      if (role) role.value = window.KMMI18n ? window.KMMI18n.t(`role.${settings.role}`) : settings.role;
      event.target.value = selected;
    });
  }

  window.KMMSecurity = window.KMMSecurity || {};
  window.KMMSecurity.settings = {
    bindSettingsPage,
    readSettings,
    updateSettings
  };
})(window);
