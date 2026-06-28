# KMM Sales Intelligence Platform Architecture

## Project Purpose

KMM Sales Intelligence Platform is a static sales intelligence application for reviewing sales units, sales value, gross profit, commission, product mix, dealer performance, salesman performance, and forecast indicators.

The application is intentionally simple to deploy: GitHub Pages can serve the repository directly because the dashboard uses only static HTML, CSS, JavaScript, local Chart.js, and a generated JSON data file.

## Current v5 Enterprise Foundation Architecture

The v5 Enterprise Foundation keeps the v4 static dashboard contract and adds a shared front-end foundation for reusable components, dashboard module structure, rule-based AI insights, and export placeholders. The architecture remains static HTML, CSS, JavaScript, local Chart.js, and generated JSON data.

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
    bi-utils.js
    bi-filters.js
    bi-charts.js
    bi-core.js
    bi-enterprise.js
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

1. The browser opens a static dashboard HTML file.
2. The page loads `css/bi-core.css`.
3. `bi-core.css` imports the shared design system, layout, components, and modules.
4. The page loads local `js/chart.umd.min.js`.
5. The page loads shared BI modules:
   - `js/bi-utils.js`
   - `js/bi-filters.js`
   - `js/bi-charts.js`
   - `js/bi-core.js`
6. The page loads its page-specific script, such as `js/executive.js`.
7. On `DOMContentLoaded`, the page fetches `data/dashboard_data.json`.
8. Shared utilities normalize product types, filter core product rows, calculate KPI values, and render charts/tables.

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
- `bi-enterprise.css` - v5 AI insight cards, module readiness pills, export placeholder buttons, and enterprise footer.

Additional legacy or page-specific CSS files exist in `dashboard/css/`. New work should prefer the v4 shared files unless a page-specific requirement is explicit.

## Shared JS Modules

- `bi-utils.js` owns formatting, data loading, product type normalization, core product filtering, KPI calculation, grouping, and DOM helper functions.
- `bi-filters.js` owns filter population, filter state, filter application, reset behavior, and filter event binding.
- `bi-charts.js` wraps Chart.js with shared palette, defaults, tooltip behavior, dataset enhancement, chart destruction, and render helpers.
- `bi-core.js` exposes shared rendering helpers and backward-compatible global aliases used by page scripts.
- `bi-enterprise.js` exposes the v5 foundation:
  - shared component helper `BI.enterprise.components.el()`.
  - dashboard module registry for Landing Dashboard, Booking Dashboard, Inventory Dashboard, Finance Dashboard, Dealer KPI, and Salesman KPI.
  - rule-based AI insight rendering from `dashboard_data.json`.
  - safe export placeholder handlers for PDF, PowerPoint, Excel, and PNG.
  - page footer and enterprise foundation panel injection.

## v5 Module Framework

The current six pages remain the production entry points. The module framework documents where future dashboards fit without changing existing paths:

- Landing Dashboard: executive summary foundation, currently represented by `executive.html`.
- Booking Dashboard: booking and pipeline foundation, currently represented through booking/funnel placeholder sections.
- Inventory Dashboard: product and stock foundation, currently represented by `product.html` and dealer stock sections.
- Finance Dashboard: sales value, gross profit, GP margin, commission, and collection metrics across current pages.
- Dealer KPI: dealer ranking, dealer health, market coverage, and dealer scorecard in `dealer.html`.
- Salesman KPI: salesman ranking, performance matrix, activity, and coaching insight in `salesman.html`.

## AI Intelligence Foundation

The v5 AI layer is intentionally rule-based and browser-only. It does not call external APIs. Each page passes filtered rows to `BI.enterprise.refresh(rows)`, which generates a clean insight from loaded dashboard data. If no rows match the filters, the insight card shows a no-data placeholder.

Current insight types:

- Executive Summary.
- Sales Coaching Insight.
- Product Recommendation.
- Dealer Health Insight.
- Forecast Recommendation.
- KPI Alert Center.

## Export Foundation

The v5 export layer adds visible buttons for PDF, PowerPoint, Excel, and PNG. The handlers are safe placeholders and never throw or call external libraries. Full file generation is deferred so the current GitHub Pages deployment remains lightweight.

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
