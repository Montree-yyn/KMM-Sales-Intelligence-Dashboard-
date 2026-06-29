(function (window) {
  "use strict";

  const ROUTES = {
    "focus.html": "focus",
    "executive.html": "executive",
    "sales.html": "sales",
    "market.html": "market",
    "stock.html": "stock",
    "team.html": "team",
    "reports.html": "reports",
    "salesman.html": "salesman",
    "salesman_capability.html": "salesman",
    "product.html": "product",
    "dealer.html": "dealer",
    "forecast.html": "forecast",
    "settings.html": "settings"
  };

  const ROLE_PERMISSIONS = {
    SuperAdmin: ["*"],
    Executive: ["focus", "executive", "sales", "market", "stock", "team", "reports", "salesman", "product", "dealer", "forecast", "settings"],
    Manager: ["focus", "executive", "sales", "market", "stock", "team", "reports", "salesman", "product", "dealer", "forecast", "settings"],
    Sales: ["focus", "sales", "market", "stock", "team", "reports", "salesman", "product", "dealer", "forecast", "settings"],
    Viewer: ["focus", "executive", "sales", "market", "stock", "team", "reports", "product", "dealer", "forecast", "settings"]
  };

  function permissionForPath(pathname) {
    const page = String(pathname || "").split("/").pop() || "focus.html";
    return ROUTES[page] || null;
  }

  function permissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  }

  function roleLabel(role) {
    const selectedRole = ROLE_PERMISSIONS[role] ? role : "Viewer";
    return window.KMMI18n ? window.KMMI18n.t(`role.${selectedRole}`) : selectedRole;
  }

  function canAccess(role, permission) {
    if (!permission) return true;
    const permissions = permissionsForRole(role);
    return permissions.includes("*") || permissions.includes(permission);
  }

  function canAccessPath(role, pathname) {
    return canAccess(role, permissionForPath(pathname));
  }

  window.KMMSecurity = window.KMMSecurity || {};
  window.KMMSecurity.permission = {
    ROLE_PERMISSIONS,
    ROUTES,
    canAccess,
    canAccessPath,
    permissionForPath,
    permissionsForRole,
    roleLabel
  };
})(window);
