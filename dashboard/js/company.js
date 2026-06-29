(function (window) {
  "use strict";

  const COMPANIES = {
    KMM: {
      code: "KMM",
      name: "Kubota Myanmar",
      themeClass: "company-kmm",
      dataset: "data/dashboard_data.json"
    },
    KM: {
      code: "KM",
      name: "Kubota Mandalay",
      themeClass: "company-km",
      dataset: "data/dashboard_data.json"
    },
    TS: {
      code: "TS",
      name: "Tractor Sales",
      themeClass: "company-ts",
      dataset: "data/dashboard_data.json"
    }
  };

  function getCompanies() {
    return Object.keys(COMPANIES).map(code => COMPANIES[code]);
  }

  function getCompany(code) {
    return COMPANIES[code] || COMPANIES.KMM;
  }

  function getCompanyLabel(code) {
    const company = getCompany(code);
    return window.KMMI18n ? window.KMMI18n.t(`company.${company.code}`) : company.name;
  }

  function getSelectedCompany() {
    const auth = window.KMMSecurity && window.KMMSecurity.auth;
    const session = auth ? auth.readSession() : null;
    return getCompany(session && session.company);
  }

  function setSelectedCompany(code) {
    const auth = window.KMMSecurity && window.KMMSecurity.auth;
    if (!auth) return getCompany(code);
    const session = auth.readSession();
    if (!session) return getCompany(code);
    session.company = getCompany(code).code;
    auth.writeSession(session);
    applyCompanyTheme();
    return getCompany(session.company);
  }

  function applyCompanyTheme() {
    const selected = getSelectedCompany();
    document.documentElement.dataset.company = selected.code;
    document.body.classList.remove("company-kmm", "company-km", "company-ts");
    document.body.classList.add(selected.themeClass);
    return selected;
  }

  function datasetPath() {
    return getSelectedCompany().dataset;
  }

  window.KMMSecurity = window.KMMSecurity || {};
  window.KMMSecurity.company = {
    COMPANIES,
    applyCompanyTheme,
    datasetPath,
    getCompanies,
    getCompany,
    getCompanyLabel,
    getSelectedCompany,
    setSelectedCompany
  };
})(window);
