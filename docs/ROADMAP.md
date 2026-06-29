# KMM Sales Intelligence Platform Roadmap

## Project Purpose

KMM Sales Intelligence Platform is a static business intelligence dashboard suite for Kubota Myanmar sales operations. It turns Excel-based sales records into browser-ready dashboards for executive review, sales performance management, product analysis, dealer analysis, and sales forecasting.

The platform is designed for GitHub Pages compatibility:

- Static HTML, CSS, and JavaScript only.
- No npm dependency workflow.
- No backend server.
- No build tools.
- Data is loaded from `dashboard/data/dashboard_data.json`.

## Current v6 Executive Intelligence Scope

The current v6 Executive Intelligence release keeps six primary dashboard pages:

- `dashboard/executive.html` - Executive Overview.
- `dashboard/salesman.html` - Sales Performance.
- `dashboard/sales.html` - Sales Analytics.
- `dashboard/product.html` - Product Intelligence.
- `dashboard/dealer.html` - Dealer Intelligence.
- `dashboard/forecast.html` - Sales Forecast AI.

The root `index.html` redirects to `dashboard/salesman.html`.

v6 builds on the v5.2 Enterprise Intelligence dashboard with a true Executive Intelligence Cockpit on `dashboard/executive.html` while preserving GitHub Pages compatibility. It adds leadership KPI walls, a rule-based AI Executive Briefing, upgraded Chart.js visuals, alert cards, action cards, module-specific drill-downs, and V6 export placeholders using the Kubota orange, dark navy, green, blue, and white visual system.

V6 Executive Intelligence includes:

- Executive Cockpit layout with KPI Wall, Sales Trend Chart, Dealer Ranking Chart, Product Mix Chart, GP / Margin Quality Panel, Booking / Pipeline Panel, Forecast Gap Panel, and Risk & Opportunity Panel.
- AI Executive Briefing generated from `dashboard/data/dashboard_data.json` only, with top performance signal, main risk, recommended action, dealer to watch, product to push, and salesman insight.
- Drill-down links from dealer cards to `dealer.html`, product cards to `product.html`, salesman insights to `salesman.html`, and sales trend surfaces to `sales.html`.
- Executive Alert Center with green, yellow, and red cards for GP risk, dealer concentration risk, forecast gap risk, and stock / booking availability signals.
- Upgraded Chart.js executive charts with gradients, rounded bars, responsive containment, and premium tooltips.
- Sales Intelligence with KPI wall, funnel placeholder, trend comparison, booking / landing placeholder, source analysis, AI sales insight, and action recommendations.
- Salesman Intelligence with KPI wall, coaching insight, ranking, performance matrix placeholder, product specialization, lead source insight, and action recommendations.
- Product Intelligence with KPI wall, model ranking highlight, product mix insight, slow-moving / risk placeholder, and product recommendation cards.
- Dealer Intelligence with KPI wall, dealer score placeholder, ranking, dealer health insight, and dealer action cards.
- Forecast Intelligence with KPI wall, forecast vs actual section, gap analysis, risk / opportunity insight, and confidence placeholder.
- Rule-based AI insights generated from `dashboard/data/dashboard_data.json` for sales performance, dealer performance, product performance, forecast risk, low GP warning, and top performer.
- Export Center foundation buttons for PDF, PowerPoint, Excel, and PNG with safe V6 placeholder messaging.
- Improved KPI walls, glass cards, insight cards, alert cards, action cards, spacing, chart containment, and mobile wrapping.
- No external AI API calls, no backend, no npm workflow, and no build tooling.

## V7.1 Production Ready Upgrade

V7.1 upgrades the V7 Enterprise Platform for real executive review while preserving the static GitHub Pages deployment model.

- Production Report Center on `dashboard/executive.html` with Weekly Report, Monthly Report, Executive Summary, and Dealer Review buttons.
- Report modals generate professional rule-based report text from the current filtered `dashboard/data/dashboard_data.json` rows only.
- AI Executive Summary now includes overall sales result, leading dealer, leading product, GP margin signal, forecast risk, and recommended next action.
- Export Center practical foundation adds CSV summary download through the existing Excel button and a browser-native PNG dashboard capture attempt.
- PDF export remains a prepared V7.2 placeholder with the message `PDF export is prepared for V7.2.`
- PowerPoint export remains a prepared V7.2 placeholder with the message `PowerPoint export is prepared for V7.2.`
- Presentation Mode hides the sidebar, expands executive content, and toggles back without changing routes or data.
- UI polish improves report cards, modals, export buttons, mobile wrapping, print output, and horizontal overflow protection.
- Protected data generation files remain unchanged: `dashboard/data/dashboard_data.json` and `tools/update_dashboard.py`.

## V8 Enterprise AI Copilot

V8 builds on V7.1 Production Ready with a practical executive copilot on `dashboard/executive.html`. It remains static, browser-only, and GitHub Pages compatible.

- Visible Enterprise AI Copilot section on the Executive Intelligence Cockpit.
- Free-text question input with preset prompts for current sales performance, dealer needing attention, product to push, forecast risk, and next best action.
- Rule-based answer engine in `dashboard/js/bi-enterprise.js` using filtered rows from `dashboard/data/dashboard_data.json`.
- Intent detection from business keywords for sales, dealer, product, forecast, and action questions.
- Answer cards for KPI summary, dealer insight, product insight, forecast insight, and recommended action.
- Executive integration in `dashboard/js/executive.js` so copilot answers refresh from current filters without page reload.
- Professional no-data placeholders when filtered data is unavailable.
- No external AI API calls, no backend, no npm workflow, no build tooling, and no data contract change.

## V8.1 Roadmap

V8.1-V9 adds an Enterprise Security Platform on top of the V8 Enterprise AI Copilot while preserving the static GitHub Pages deployment model.

1. Login screen with username and password validation before `sessionStorage` session state is created.
2. Route guard for Executive, Sales, Salesman, Product, Dealer, Forecast, and Settings pages.
3. Configurable inactivity timeout, defaulting to 15 minutes.
4. Top-right session profile control with logout.
5. Reusable role framework for SuperAdmin, Executive, Manager, Sales, and Viewer.
6. Company framework for KMM, KM, and TS with company selector, theme placeholder, and dataset loader placeholder.
7. Settings framework for theme, company, session timeout, language, readonly role, and version.
8. Better natural language intent handling with richer synonym coverage and confidence scoring.
9. Cross-page data search that can answer questions spanning Executive, Sales, Salesman, Product, Dealer, and Forecast views.
10. Optional future OpenAI/API integration after an approved static-safe or service-backed architecture decision.

V8.1 security limitation: credentials are stored in static JavaScript as temporary local access control for GitHub Pages. This protects casual access only because delivered browser code can be inspected. V10 should replace this with Firebase Auth, Microsoft Entra ID, Google Workspace, or server-side authentication with secure token/session validation, audit logging, and tenant-aware authorization.

## V8.1 Thai-First Dashboard UX

V8.1-V9 adds full Thai language support while preserving English as fallback and keeping the platform static and GitHub Pages compatible.

- `dashboard/js/i18n.js` provides the shared Thai/English dictionary, `sessionStorage` language persistence, and `window.KMMI18n` helpers.
- Thai is the default language for login, settings, navigation, dashboard headers, filters, KPI labels, export/report controls, security messages, role/company labels, and safe AI/report labels.
- Login, settings, and the enterprise dashboard header expose Thai/English selectors where the user naturally expects them.
- Noto Sans Thai, Thai-friendly line height, wrapping buttons, and readable sidebar labels are part of the shared CSS baseline.
- The implementation does not change `dashboard/data/dashboard_data.json`, `tools/update_dashboard.py`, backend behavior, npm dependencies, or build tooling.

## V9 Stabilization & Thai Production Upgrade

V9 stabilizes the V8.1 security platform and Thai-first dashboard experience for production use under the current static hosting constraints.

- Thai is the default language for login, settings, route/session messages, dashboard headers, side navigation, filters, KPI cards, generated AI insight cards, copilot answers, report center text, export buttons, and toasts.
- English remains available as fallback through `dashboard/js/i18n.js` and the language selector.
- Login requires username and password; invalid users and wrong passwords fail before a session is created.
- Session storage keeps only non-password session metadata.
- Protected dashboard URLs redirect unauthenticated or expired users to `dashboard/login.html`.
- CSS improves Thai font rendering, line-height, wrapping, sidebar readability, and mobile overflow protection.
- PDF and PowerPoint exports remain clear placeholders; CSV and PNG stay static/browser-safe foundations.
- Company selector remains a framework placeholder until approved tenant-safe datasets exist.

Security limitation: V9 still uses static credentials delivered in JavaScript as temporary V8.1 protection for casual access only. V10 must replace this with real authentication.

## V10.1 Stabilization

V10.1 completes a controlled stabilization pass over the existing static V10 production dashboard. It does not restart the architecture and keeps the dashboard static, browser-only, and GitHub Pages compatible.

- Thai remains the default language, with broader coverage across static HTML and JS-generated text.
- Login, password validation, session timeout, and logout behavior are stabilized without storing passwords in session state.
- Settings is improved for language, company, role, timeout, theme, and version review.
- Thai readability, line height, button wrapping, sidebar labels, and mobile overflow handling are improved in the shared CSS baseline.
- Report Center generates Thai local summaries without external services.
- Export Center supports CSV summary download and attempts PNG export; PDF and PowerPoint remain clear Thai placeholders.
- AI Copilot keeps Thai preset questions and local rule-based Thai answers.
- Protected files remain unchanged: `dashboard/data/dashboard_data.json` and `tools/update_dashboard.py`.

## V11 Enterprise Edition

V11 Enterprise Edition is a controlled sprint on top of V10.1 Stable. It improves the existing dashboard without restarting architecture, changing the data contract, adding backend services, adding npm, or touching the Excel-to-JSON update pipeline.

- Thai is the default UX across login, settings, navigation, KPI labels, executive copy, JS-generated summaries, report previews, export messages, and security notes.
- Executive usability adds KPI help text, a "How to read this dashboard" panel, clearer AI Summary language, and management-oriented recommendations.
- Settings becomes the static admin foundation for current user, role, company, version, session timeout, user-management placeholder, About, Release Notes, and Help Center sections.
- Report Center keeps Weekly Report, Monthly Report, Executive Summary, and Dealer Review buttons working with Thai static report previews.
- Export Center keeps browser-safe CSV/PNG foundations and clear Thai placeholders for PDF and PowerPoint.
- Mobile and tablet polish improves Thai wrapping, sidebar readability, button wrapping, and horizontal overflow containment.
- Protected files remain unchanged: `dashboard/data/dashboard_data.json` and `tools/update_dashboard.py`.

## Near-Term Priorities

1. V12 Authentication: replace static credentials with a real identity provider or server-side authentication, token/session validation, audit logs, role claims, and tenant-aware authorization.
2. Real Export Center: implement reviewed PDF and PowerPoint exports with print fidelity, safe file naming, and clear static-vs-service architecture.
3. Multi-company datasets: add tenant/company identifiers, dataset partitioning, export isolation, and company-specific permissions before activating real company switching.
4. Copilot: improve natural language intent, cross-page search, and report generation from copilot answers while staying rule-based until an approved service layer exists.
5. PWA: explore installable mobile access and offline caching while preserving static hosting.
6. Keep dashboard pages aligned with the shared CSS and JS modules.
7. Maintain clean Excel-to-JSON updates through `tools/update_dashboard.py`.

## Future Roadmap

### Landing Dashboard

Create a single entry dashboard that summarizes the most important KPIs and directs users into the specialized dashboards. It should include high-level sales, GP, dealer, product, and forecast indicators.

### Booking Dashboard

Add a dashboard focused on booking pipeline performance, booking-to-delivery conversion, pending bookings, dealer booking health, and booking trends by product type and region.

### Inventory Dashboard

Add inventory visibility for current stock, stock aging, slow-moving models, product availability, dealer stock distribution, and sales-to-stock ratios.

### Executive AI Summary

Add an executive summary layer that converts KPI movements into concise business observations. This should remain static and browser-compatible unless an explicit future architecture decision adds a service layer.

V8 status: delivered as a rule-based Executive Intelligence Cockpit and Enterprise AI Copilot on the executive page, with the existing Enterprise Intelligence layer preserved across all six primary dashboard pages. Future work should focus on richer comparisons, target configuration, cross-page copilot search, report generation from copilot answers, and optional approved API architecture.

### Export Center

V7.1 delivers practical CSV export and a safe browser-native PNG capture attempt. V7.2 should replace the PDF and PowerPoint placeholders with real board-pack exports after bundle size, browser compatibility, print fidelity, and GitHub Pages constraints are reviewed.

Future real exports should support executive board packs, filtered report snapshots, Thai text rendering, and predictable file names. If browser-only export quality is insufficient, the roadmap should explicitly approve an authenticated export service rather than hiding backend work inside the static app.

### Forecast AI

Continue improving the existing Forecast AI page with stronger scenario modeling, better target-gap analysis, regional forecast views, and clearer confidence indicators.

### PWA Mobile App

Explore a progressive web app layer for mobile access, offline caching, and installable dashboard shortcuts. Any PWA work must preserve the static GitHub Pages architecture.

### Multi-Company

V8 should introduce company-level segmentation only after the dashboard data contract supports safe company identifiers, permissions expectations, branding rules, tenant-safe filters, and export isolation.

V8.1-V9 now includes the browser-side company framework for KMM, KM, and TS. The current selector stores the active company in `sessionStorage` and exposes theme and dataset placeholders. Future work should connect those placeholders to approved company-specific datasets only after the data contract includes tenant identifiers and export isolation rules.

The future multi-company dataset roadmap must define tenant keys, dataset ownership, permission inheritance, export boundaries, and cross-company visibility rules before any production company switch can affect data.

### Future Cloud Authentication

The current security platform is a static front-end framework, not a backend authentication service. V8.1 uses static local credentials only as temporary protection for casual access. Future cloud authentication should add Firebase Auth, Microsoft Entra ID, Google Workspace, or server-side authentication with real identity provider validation, server-side session validation, token refresh, audit logging, password policy, tenant-aware authorization, and secure secrets handling. Any cloud authentication design must explicitly preserve or replace the current GitHub Pages hosting model.

V10 should remove static credentials from browser JavaScript, enforce password/identity policy outside the client, validate roles from trusted claims, expire/refresh tokens safely, and record audit events for login, logout, access denial, export, and company switching.

## Release Principles

- Prioritize reliable executive reporting over visual novelty.
- Keep every new feature compatible with static hosting.
- Extend shared CSS and JS before creating one-off page patterns.
- Treat the JSON data schema as a stable contract.
- Document any new dashboard page, data field, or shared component.
