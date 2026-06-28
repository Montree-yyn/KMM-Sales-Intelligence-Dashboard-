# KMM Sales Intelligence Platform Roadmap

## Project Purpose

KMM Sales Intelligence Platform is a static business intelligence dashboard suite for Kubota Myanmar sales operations. It turns Excel-based sales records into browser-ready dashboards for executive review, sales performance management, product analysis, dealer analysis, and sales forecasting.

The platform is designed for GitHub Pages compatibility:

- Static HTML, CSS, and JavaScript only.
- No npm dependency workflow.
- No backend server.
- No build tools.
- Data is loaded from `dashboard/data/dashboard_data.json`.

## Current v5.2 Enterprise Intelligence Scope

The current v5.2 Enterprise Intelligence release keeps six primary dashboard pages:

- `dashboard/executive.html` - Executive Overview.
- `dashboard/salesman.html` - Sales Performance.
- `dashboard/sales.html` - Sales Analytics.
- `dashboard/product.html` - Product Intelligence.
- `dashboard/dealer.html` - Dealer Intelligence.
- `dashboard/forecast.html` - Sales Forecast AI.

The root `index.html` redirects to `dashboard/salesman.html`.

v5.2 builds on the v5.1 Enterprise Plus dashboard with a shared intelligence layer across every page while preserving GitHub Pages compatibility. It adds enterprise KPI walls, rule-based insight panels, alert cards, action cards, module-specific snapshots, and V5.3 export placeholders using the Kubota orange, dark navy, green, blue, and white visual system.

V5.2 Enterprise Intelligence includes:

- Executive BI Command Center with KPI wall, summary panel, alert center, top risks, next actions, dealer snapshot, product snapshot, and monthly gap / forecast placeholder.
- Sales Intelligence with KPI wall, funnel placeholder, trend comparison, booking / landing placeholder, source analysis, AI sales insight, and action recommendations.
- Salesman Intelligence with KPI wall, coaching insight, ranking, performance matrix placeholder, product specialization, lead source insight, and action recommendations.
- Product Intelligence with KPI wall, model ranking highlight, product mix insight, slow-moving / risk placeholder, and product recommendation cards.
- Dealer Intelligence with KPI wall, dealer score placeholder, ranking, dealer health insight, and dealer action cards.
- Forecast Intelligence with KPI wall, forecast vs actual section, gap analysis, risk / opportunity insight, and confidence placeholder.
- Rule-based AI insights generated from `dashboard/data/dashboard_data.json` for sales performance, dealer performance, product performance, forecast risk, low GP warning, and top performer.
- Export Center foundation buttons for PDF, PowerPoint, Excel, and PNG with safe V5.3 placeholder messaging.
- Improved KPI walls, insight cards, alert cards, action cards, spacing, chart containment, and mobile wrapping.
- No external AI API calls, no backend, no npm workflow, and no build tooling.

## Near-Term Priorities

1. V5.3 Export Center: replace placeholders with lightweight static exports only when risk is acceptable.
2. AI Copilot: define a future approved architecture before any external AI API integration.
3. PWA: explore installable mobile access and offline caching while preserving static hosting.
4. Multi-company engine: evaluate company-level filters, branding, data partitioning, and tenant-safe configuration.
5. Keep dashboard pages aligned with the shared CSS and JS modules.
6. Maintain clean Excel-to-JSON updates through `tools/update_dashboard.py`.
7. Keep AI insight generation rule-based until a backend or approved API integration exists.

## Future Roadmap

### Landing Dashboard

Create a single entry dashboard that summarizes the most important KPIs and directs users into the specialized dashboards. It should include high-level sales, GP, dealer, product, and forecast indicators.

### Booking Dashboard

Add a dashboard focused on booking pipeline performance, booking-to-delivery conversion, pending bookings, dealer booking health, and booking trends by product type and region.

### Inventory Dashboard

Add inventory visibility for current stock, stock aging, slow-moving models, product availability, dealer stock distribution, and sales-to-stock ratios.

### Executive AI Summary

Add an executive summary layer that converts KPI movements into concise business observations. This should remain static and browser-compatible unless an explicit future architecture decision adds a service layer.

V5.2 status: delivered as a rule-based Enterprise Intelligence layer across all six primary dashboard pages. Future work should focus on richer comparisons, target configuration, and optional approved AI Copilot architecture.

### Export Center

Replace the V5.2 placeholder buttons with static-friendly export features for PDF, PowerPoint, Excel, and PNG. Avoid heavy libraries until bundle size, browser compatibility, and GitHub Pages constraints are reviewed.

### Forecast AI

Continue improving the existing Forecast AI page with stronger scenario modeling, better target-gap analysis, regional forecast views, and clearer confidence indicators.

### PWA Mobile App

Explore a progressive web app layer for mobile access, offline caching, and installable dashboard shortcuts. Any PWA work must preserve the static GitHub Pages architecture.

### Multi-Company

Add company-level segmentation only after the dashboard data contract supports safe company identifiers, permissions expectations, and branding rules.

## Release Principles

- Prioritize reliable executive reporting over visual novelty.
- Keep every new feature compatible with static hosting.
- Extend shared CSS and JS before creating one-off page patterns.
- Treat the JSON data schema as a stable contract.
- Document any new dashboard page, data field, or shared component.
