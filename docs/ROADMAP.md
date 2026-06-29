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

1. Better natural language intent handling with richer synonym coverage and confidence scoring.
2. Cross-page data search that can answer questions spanning Executive, Sales, Salesman, Product, Dealer, and Forecast views.
3. Report generation from copilot answers, reusing the V7.1 Production Report Center patterns.
4. Optional future OpenAI/API integration after an approved static-safe or service-backed architecture decision.
5. Persisted copilot prompt history, if storage and privacy expectations are approved.

## Near-Term Priorities

1. V8.1 Copilot: improve natural language intent, cross-page search, and report generation from copilot answers.
2. V7.2 Export Center: implement real PDF and PowerPoint exports with reviewed lightweight/static-safe technology.
3. PWA: explore installable mobile access and offline caching while preserving static hosting.
4. V8 multi-company engine: evaluate company-level filters, branding, data partitioning, and tenant-safe configuration.
5. Keep dashboard pages aligned with the shared CSS and JS modules.
6. Maintain clean Excel-to-JSON updates through `tools/update_dashboard.py`.
7. Keep AI insight and copilot generation rule-based until a backend or approved API integration exists.

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

### Forecast AI

Continue improving the existing Forecast AI page with stronger scenario modeling, better target-gap analysis, regional forecast views, and clearer confidence indicators.

### PWA Mobile App

Explore a progressive web app layer for mobile access, offline caching, and installable dashboard shortcuts. Any PWA work must preserve the static GitHub Pages architecture.

### Multi-Company

V8 should introduce company-level segmentation only after the dashboard data contract supports safe company identifiers, permissions expectations, branding rules, tenant-safe filters, and export isolation.

## Release Principles

- Prioritize reliable executive reporting over visual novelty.
- Keep every new feature compatible with static hosting.
- Extend shared CSS and JS before creating one-off page patterns.
- Treat the JSON data schema as a stable contract.
- Document any new dashboard page, data field, or shared component.
