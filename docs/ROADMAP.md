# KMM Sales Intelligence Platform Roadmap

## Project Purpose

KMM Sales Intelligence Platform is a static business intelligence dashboard suite for Kubota Myanmar sales operations. It turns Excel-based sales records into browser-ready dashboards for executive review, sales performance management, product analysis, dealer analysis, and sales forecasting.

The platform is designed for GitHub Pages compatibility:

- Static HTML, CSS, and JavaScript only.
- No npm dependency workflow.
- No backend server.
- No build tools.
- Data is loaded from `dashboard/data/dashboard_data.json`.

## Current v4 Scope

The current v4 dashboard architecture includes six primary dashboard pages:

- `dashboard/executive.html` - Executive Overview.
- `dashboard/salesman.html` - Sales Performance.
- `dashboard/sales.html` - Sales Analytics.
- `dashboard/product.html` - Product Intelligence.
- `dashboard/dealer.html` - Dealer Intelligence.
- `dashboard/forecast.html` - Sales Forecast AI.

The root `index.html` redirects to `dashboard/salesman.html`.

## Near-Term Priorities

1. Stabilize the shared design system across all current dashboard pages.
2. Keep dashboard pages aligned with the shared v4 CSS and JS modules.
3. Maintain clean Excel-to-JSON updates through `tools/update_dashboard.py`.
4. Improve mobile usability for executive and field users.
5. Expand reusable dashboard components before adding new page-specific patterns.

## Future Roadmap

### Landing Dashboard

Create a single entry dashboard that summarizes the most important KPIs and directs users into the specialized dashboards. It should include high-level sales, GP, dealer, product, and forecast indicators.

### Booking Dashboard

Add a dashboard focused on booking pipeline performance, booking-to-delivery conversion, pending bookings, dealer booking health, and booking trends by product type and region.

### Inventory Dashboard

Add inventory visibility for current stock, stock aging, slow-moving models, product availability, dealer stock distribution, and sales-to-stock ratios.

### Executive AI Summary

Add an executive summary layer that converts KPI movements into concise business observations. This should remain static and browser-compatible unless an explicit future architecture decision adds a service layer.

### Forecast AI

Continue improving the existing Forecast AI page with stronger scenario modeling, better target-gap analysis, regional forecast views, and clearer confidence indicators.

### PWA Mobile App

Explore a progressive web app layer for mobile access, offline caching, and installable dashboard shortcuts. Any PWA work must preserve the static GitHub Pages architecture.

## Release Principles

- Prioritize reliable executive reporting over visual novelty.
- Keep every new feature compatible with static hosting.
- Extend shared CSS and JS before creating one-off page patterns.
- Treat the JSON data schema as a stable contract.
- Document any new dashboard page, data field, or shared component.

