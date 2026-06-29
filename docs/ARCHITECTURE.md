# KMM Sales Intelligence Platform Architecture

## Project Purpose

KMM Sales Intelligence Platform is a static sales intelligence application for reviewing sales units, sales value, gross profit, commission, product mix, dealer performance, salesman performance, and forecast indicators.

The application is intentionally simple to deploy: GitHub Pages can serve the repository directly because the dashboard uses only static HTML, CSS, JavaScript, local Chart.js, and a generated JSON data file.

## Current v5.2 Enterprise Intelligence Architecture

The v5.2 Enterprise Intelligence architecture keeps the static dashboard contract and adds a shared front-end intelligence layer for reusable components, dashboard module structure, rule-based AI insights, page-specific BI panels, and export placeholders. The architecture remains static HTML, CSS, JavaScript, local Chart.js, and generated JSON data.

```text
index.html
dashboard/
  executive.html
  salesman.html
  sales.html
  product.html
  dealer.html
  forecast.html
  css/
    bi-core.css
    design-system.css
    bi-layout.css
    bi-components.css
    bi-modules.css
  js/
    chart.umd.min.js
    i18n.js
    bi-utils.js
    bi-filters.js
    bi-charts.js
    bi-core.js
    bi-enterprise.js
    auth.js
    permission.js
    company.js
    settings.js
    route-guard.js
    executive.js
    salesman.js
    sales.js
    product.js
    dealer.js
    forecast.js
  data/
    dashboard_data.json
tools/
  update_dashboard.py
data/
  2026_KMM_CPI.xlsx
```

## Runtime Flow

1. The browser opens `dashboard/login.html` or a static dashboard HTML file.
2. Protected dashboard files load `i18n.js` before security scripts so Thai labels, English fallback text, and language selectors are available during login, route guard, settings, and dashboard rendering.
3. Protected dashboard files load `auth.js`, `permission.js`, `company.js`, `settings.js`, and `route-guard.js`.
4. `route-guard.js` verifies the `sessionStorage` session, checks role permissions, validates inactivity timeout, applies the selected company theme placeholder, injects company/language/settings/profile controls, and redirects unauthenticated users to `login.html`.
5. The page loads `css/bi-core.css`.
6. `bi-core.css` imports Noto Sans Thai plus the shared design system, layout, components, modules, enterprise styles, and security styles.
7. The page loads local `js/chart.umd.min.js`.
8. The page loads shared BI modules:
   - `js/bi-utils.js`
   - `js/bi-filters.js`
   - `js/bi-charts.js`
   - `js/bi-core.js`
9. The page loads its page-specific script, such as `js/executive.js`.
10. On `DOMContentLoaded`, the page fetches `data/dashboard_data.json`.
11. Shared utilities normalize product types, filter core product rows, calculate KPI values, and render charts/tables.

## Thai-First I18n Framework

`dashboard/js/i18n.js` provides the browser-only localization layer. It supports `th` and `en`, defaults to Thai, stores the selected language in `sessionStorage` under `kmm.i18n.language`, and exposes `window.KMMI18n.t(key)`, `setLanguage(lang)`, `getLanguage()`, and `applyTranslations(root)`.

The framework translates explicit `data-i18n`, `data-i18n-placeholder`, and `data-i18n-aria` attributes and also maps known static dashboard text to dictionary keys. This keeps generated one-line dashboard pages usable without changing the data contract or adding a build step. English remains the fallback for missing keys.

Thai-first UX is applied to navigation, login, settings, filters, KPI labels, export/report controls, security bar labels, role labels, company labels, and safe AI/report status text. V9 stabilization extends this to JavaScript-generated AI insight cards, copilot answers, report modal text, export toasts, enterprise deck panels, and executive briefing text while preserving English fallback through `window.KMMI18n.t(key)`.

## V9 Stabilization Layer

V9 Stabilization keeps the same static runtime but hardens the production UX for Thai users:

- Thai remains the default language, including dynamic JavaScript-generated insight/report/export/security text.
- English remains the fallback language through the shared dictionary and language selector.
- `bi-core.css` imports Noto Sans Thai, raises Thai line-height, allows button/sidebar wrapping, and prevents horizontal overflow on mobile.
- Static security remains temporary V8.1 protection only. Usernames and passwords are validated before session creation, but credentials are delivered in JavaScript and are not a replacement for real authentication.
- The password is never written to `sessionStorage`; only username, role, company, theme, language, timeout, timestamps, and version metadata are stored.
- Protected routes redirect unauthenticated or expired sessions back to `dashboard/login.html`.

The stabilization pass does not modify `dashboard/data/dashboard_data.json`, `tools/update_dashboard.py`, backend behavior, npm dependencies, or build tooling.

## V8.1-V9 Enterprise Security Platform

The security platform is browser-only and GitHub Pages compatible. It does not add a backend, npm package, build step, or external identity provider.

- `dashboard/login.html` creates a professional login surface for KMM Sales Intelligence Platform.
- `dashboard/js/auth.js` owns session creation, session reads/writes, inactivity timestamps, logout reason, default 15-minute timeout, and version metadata.
- `dashboard/js/auth.js` also owns the V8.1 static local credential store and validates username plus password before any session is created.
- `dashboard/js/route-guard.js` protects dashboard routes, redirects unauthenticated users to `login.html`, injects the top-right company selector/settings/profile controls, handles logout, and checks timeout every 30 seconds.
- `dashboard/js/permission.js` maps routes to permission keys and maps roles to permissions without hardcoding checks inside page files.
- `dashboard/js/company.js` defines KMM, KM, and TS company metadata with theme and dataset placeholders.
- `dashboard/js/settings.js` reads and writes session-scoped settings for theme, company, timeout, language, readonly role, and version.
- `dashboard/settings.html` exposes the settings framework as a protected static page.

The current login validates username and password against static local credentials, then stores only non-password session metadata in `sessionStorage`. This is V8.1 temporary protection only: it protects casual access, but credentials are visible in delivered JavaScript and must not be treated as production-grade cloud authentication. V10 should replace this with Firebase Auth, Microsoft Entra ID, Google Workspace, or server-side authentication with secure token/session validation.

Default V8.1 static users:

- `superadmin` / `KMM@2026!` maps to SuperAdmin.
- `executive` / `Exec@2026` maps to Executive.
- `manager` / `Manager@2026` maps to Manager.
- `sales` / `Sales@2026` maps to Sales.
- `viewer` / `Viewer@2026` maps to Viewer.

## Role Platform

Roles are defined in `permission.js`:

- SuperAdmin.
- Executive.
- Manager.
- Sales.
- Viewer.

Page authorization uses route permission keys rather than page-local hardcoded checks. Future roles should extend the role-permission matrix in one place and avoid conditional logic inside dashboard page scripts.

## Company Platform

The company framework supports:

- KMM.
- KM.
- TS.

The selected company is stored in the active session. The framework currently exposes `themeClass` and `dataset` placeholders so future releases can add company-specific branding or data partitioning without changing page-level chart code.

## Dashboard Pages

### Executive Overview

File: `dashboard/executive.html`

Purpose: executive-level view of total units, sales value, gross profit, GP margin, commission, average deal size, product mix, regional performance, top models, booking placeholder, and business health score.

Page script: `dashboard/js/executive.js`

### Sales Performance

File: `dashboard/salesman.html`

Purpose: salesman performance review, including top salesman ranking, achievement view, performance matrix, achievement distribution, activity funnel, activity heatmap, and coaching insight.

Page script: `dashboard/js/salesman.js`

### Sales Analytics

File: `dashboard/sales.html`

Purpose: sales trend analysis by month, channel, payment type, product type trend, monthly table, model contribution, and sales AI summary.

Page script: `dashboard/js/sales.js`

### Product Intelligence

File: `dashboard/product.html`

Purpose: product-level insight for sales units, sales value, GP, GP margin, stock indicators, top models, type mix, product matrix, regional heatmap, inventory age, and product recommendations.

Page script: `dashboard/js/product.js`

### Dealer Intelligence

File: `dashboard/dealer.html`

Purpose: dealer ranking, dealer scorecard, dealer funnel, dealer health, stock age, outstanding collection indicators, market coverage, and dealer recommendations.

Page script: `dashboard/js/dealer.js`

### Sales Forecast AI

File: `dashboard/forecast.html`

Purpose: forecast, target, achievement, gap, forecast value, confidence, forecast trend, pipeline, deal probability, regional forecast, salesman forecast, and monthly projection.

Page script: `dashboard/js/forecast.js`

## Shared CSS Files

The dashboard pages load `dashboard/css/bi-core.css`, which imports:

- `design-system.css` - color tokens, typography, root variables, body defaults, and accent styling.
- `bi-layout.css` - app shell, sidebar, navigation, topbar, page header, grid layout, and responsive layout behavior.
- `bi-components.css` - filter bars, KPI cards, panels, chart containers, tables, buttons, and form controls.
- `bi-modules.css` - reusable dashboard modules such as lists, AI strips, score grids, funnels, heatmaps, and specialized visual blocks.
- `bi-enterprise.css` - V5.2 intelligence deck, KPI walls, insight cards, alert cards, action cards, module readiness pills, export placeholder buttons, and enterprise footer.

Additional legacy or page-specific CSS files exist in `dashboard/css/`. New work should prefer the v4 shared files unless a page-specific requirement is explicit.

## Shared JS Modules

- `bi-utils.js` owns formatting, data loading, product type normalization, core product filtering, KPI calculation, grouping, and DOM helper functions.
- `bi-filters.js` owns filter population, filter state, filter application, reset behavior, and filter event binding.
- `bi-charts.js` wraps Chart.js with shared palette, defaults, tooltip behavior, dataset enhancement, chart destruction, and render helpers.
- `bi-core.js` exposes shared rendering helpers and backward-compatible global aliases used by page scripts.
- `bi-enterprise.js` exposes the V5.2 enterprise intelligence foundation:
  - shared component helper `BI.enterprise.components.el()`.
  - dashboard module registry for Landing Dashboard, Booking Dashboard, Inventory Dashboard, Finance Dashboard, Dealer KPI, and Salesman KPI.
  - rule-based AI insight rendering from `dashboard_data.json`.
  - page-specific Enterprise Intelligence decks for Executive, Sales, Salesman, Product, Dealer, and Forecast views.
  - safe export placeholder handlers for PDF, PowerPoint, Excel, and PNG.
  - page footer and enterprise foundation panel injection.

V7.1 extends `bi-enterprise.js` with production-ready executive review helpers while keeping the same static runtime:

- `BI.enterprise.executiveSummary(rows)` creates a deterministic executive summary from filtered local rows.
- `BI.enterprise.reportLines(kind, rows)` generates Weekly Report, Monthly Report, Executive Summary, and Dealer Review text for the executive Report Center.
- The Excel export action downloads a CSV summary generated in the browser with `Blob` and relative/static-safe data only.
- The PNG export action attempts a browser-native dashboard area capture by cloning the current dashboard and drawing an SVG `foreignObject` snapshot to canvas.
- PDF and PowerPoint export actions intentionally remain V7.2 placeholders with explicit user-facing messages.
- Presentation Mode toggles a CSS class that hides the sidebar and expands dashboard content without changing data, routes, or storage.

V8 extends the same layer with an Enterprise AI Copilot:

- `BI.enterprise.generateCopilotAnswer(rows, question)` generates deterministic answer cards from filtered local rows.
- Copilot intent detection uses keyword rules for sales performance, dealer attention, product push, forecast risk, and next-best-action questions.
- Each answer includes KPI summary, dealer insight, product insight, forecast insight, and recommended action cards.
- `dashboard/js/executive.js` wires the visible copilot panel to active filters, preset question buttons, the Ask button, and Enter-key submission.
- The copilot uses DOM text rendering for answers and does not call external APIs.
- Missing or empty filtered data returns professional placeholders instead of errors.

## v5 Module Framework

The current six pages remain the production entry points. The module framework documents where future dashboards fit without changing existing paths:

- Landing Dashboard: executive summary foundation, currently represented by `executive.html`.
- Booking Dashboard: booking and pipeline foundation, currently represented through booking/funnel placeholder sections.
- Inventory Dashboard: product and stock foundation, currently represented by `product.html` and dealer stock sections.
- Finance Dashboard: sales value, gross profit, GP margin, commission, and collection metrics across current pages.
- Dealer KPI: dealer ranking, dealer health, market coverage, and dealer scorecard in `dealer.html`.
- Salesman KPI: salesman ranking, performance matrix, activity, and coaching insight in `salesman.html`.

## Enterprise Intelligence Foundation

The Enterprise intelligence layer is intentionally rule-based and browser-only. It does not call external APIs. Each page passes filtered rows to `BI.enterprise.refresh(rows)`, which generates the shared insight panel, intelligence deck, six-card rule engine, export foundation, and footer from loaded dashboard data. If no rows match the filters, the insight card shows a no-data placeholder.

Current insight types:

- Executive Summary.
- Sales Coaching Insight.
- Product Recommendation.
- Dealer Health Insight.
- Forecast Recommendation.
- KPI Alert Center.

Current V5.2 deck types:

- Executive BI Command Center.
- Sales Intelligence.
- Salesman Intelligence.
- Product Intelligence.
- Dealer Intelligence.
- Forecast Intelligence.

The V8 copilot sits on top of this foundation on `dashboard/executive.html`. It reads the same filtered rows already used by the executive KPIs, charts, briefing, reports, and exports. It does not introduce a new data file, backend endpoint, npm dependency, build process, or storage layer.

V8.1-V9 sits above the V8 copilot as a static security shell. The copilot remains local and rule-based, and the security framework does not change `dashboard/data/dashboard_data.json` or `tools/update_dashboard.py`.

## V8.1 Architecture Roadmap

- Better natural language intent: add broader keyword dictionaries, phrase normalization, and confidence labels while staying deterministic.
- Cross-page data search: let copilot answers cite signals from Sales, Salesman, Product, Dealer, and Forecast modules through shared front-end aggregators.
- Report generation from copilot: convert copilot answers into report modal content and downloadable static-safe summaries.
- Future OpenAI/API integration option: only after an explicit architecture decision covering service boundaries, secrets, privacy, cost control, offline behavior, and GitHub Pages compatibility.

## Future Cloud Authentication

Future cloud authentication should replace the current static session placeholder with a real identity layer. Required decisions include identity provider, token lifetime, refresh flow, server-side authorization, tenant claims, audit logging, logout propagation, secret handling, and whether GitHub Pages remains the hosting surface or becomes a static client served beside a cloud API.

V10 authentication should specifically add server-validated identity, secure password/secret handling, token refresh, tenant-aware authorization, audit logs, role claims, logout propagation, and rate limiting. The current static credentials must be removed when V10 authentication lands.

## Export Foundation

The V7.1 export layer keeps PDF and PowerPoint static-safe placeholders while adding practical browser downloads:

- CSV summary export through the existing Excel button.
- PNG dashboard capture attempt using browser APIs only.
- PDF placeholder message: `PDF export is prepared for V7.2.`
- PowerPoint placeholder message: `PowerPoint export is prepared for V7.2.`

No npm package, backend service, external API, or build step is introduced. V7.2 can add real PDF and PowerPoint exports after the export technology is reviewed for static hosting compatibility.

Future real export work should produce reviewed PDF/PowerPoint board packs from the same filtered local data, define print fidelity expectations, avoid leaking private filesystem paths, and decide whether export generation remains browser-only or moves to an authenticated service.

## Multi-Company Dataset Roadmap

`company.js` currently exposes KMM, KM, and TS as browser-side metadata with theme and dataset placeholders. A future multi-company release must add approved company identifiers to the data contract, tenant-aware filters, export isolation, permission rules, company-specific branding, and separate or partitioned datasets before the selector can be considered tenant-safe.

## Data Source

The dashboard data source is `dashboard/data/dashboard_data.json`.

It is generated from `data/2026_KMM_CPI.xlsx` by `tools/update_dashboard.py`. Dashboard pages should read the JSON file. They should not parse Excel directly in the browser.

## Excel Update Flow

1. Update the source workbook at `data/2026_KMM_CPI.xlsx`.
2. Run `python tools/update_dashboard.py`.
3. The script reads sheet `2026_KMM_DATA` with header row index `3`.
4. It normalizes product type and model values.
5. It calculates total commission from configured commission columns.
6. It writes `dashboard/data/dashboard_data.json`.
7. Review the dashboard locally and inspect the resulting data diff before committing.

## Static Hosting Constraints

The platform must remain compatible with GitHub Pages:

- No npm.
- No backend.
- No build tools.
- No server-side rendering.
- No runtime dependency on private APIs.
- Use relative paths that work from static files under `dashboard/`.
- Do not expose private local filesystem paths or machine-specific URLs in generated report/export text.
