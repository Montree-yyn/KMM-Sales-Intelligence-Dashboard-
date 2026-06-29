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
    updateCompanyLabels();

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
      const refreshed = readSettings();
      if (refreshed) {
        document.getElementById("settingsCompany").value = refreshed.company;
        document.getElementById("settingsLanguage").value = refreshed.language;
        document.getElementById("settingsRole").value = window.KMMI18n ? window.KMMI18n.t(`role.${refreshed.role}`) : refreshed.role;
        document.getElementById("settingsVersion").value = refreshed.version;
        updateCompanyLabels();
        renderEnterpriseSummary();
      }
    });

    document.getElementById("settingsLanguage").addEventListener("change", event => {
      const selected = window.KMMI18n ? window.KMMI18n.setLanguage(event.target.value) : event.target.value;
      updateSettings({ language: selected });
      const refreshed = readSettings() || settings;
      const role = document.getElementById("settingsRole");
      if (role) role.value = window.KMMI18n ? window.KMMI18n.t(`role.${refreshed.role}`) : refreshed.role;
      event.target.value = selected;
      updateCompanyLabels();
      renderEnterpriseSummary();
      const status = document.getElementById("settingsStatus");
      if (status) status.textContent = window.KMMI18n ? window.KMMI18n.t("settings.saved") : "Settings saved for this session.";
    });

    renderEnterpriseSummary();
  }

  function updateCompanyLabels() {
    const company = document.getElementById("settingsCompany");
    if (!company || !window.KMMSecurity.company) return;
    Array.from(company.options).forEach(option => {
      option.textContent = window.KMMSecurity.company.getCompanyLabel(option.value);
    });
  }

  function setSummaryText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderEnterpriseSummary() {
    const settings = readSettings();
    if (!settings) return;
    const t = window.KMMI18n ? window.KMMI18n.t : (key) => key;
    const companyLabel = window.KMMSecurity.company
      ? window.KMMSecurity.company.getCompanyLabel(settings.company)
      : settings.company;

    setSummaryText("summaryUser", settings.username || "-");
    setSummaryText("summaryRole", t(`role.${settings.role}`));
    setSummaryText("summaryCompany", companyLabel);
    setSummaryText("summaryVersion", settings.version);
    setSummaryText("summaryTimeout", `${settings.timeoutMinutes} ${settings.language === "th" ? "นาที" : "minutes"}`);
  }

  window.KMMSecurity = window.KMMSecurity || {};
  window.KMMSecurity.settings = {
    bindSettingsPage,
    renderEnterpriseSummary,
    readSettings,
    updateSettings
  };
})(window);
