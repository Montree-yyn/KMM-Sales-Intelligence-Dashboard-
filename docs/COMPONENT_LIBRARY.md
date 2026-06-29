# KMM Sales Intelligence Component Library

## Purpose

This document describes the reusable dashboard components currently used by KMM Sales Intelligence Platform. New dashboards should reuse these components to keep the platform consistent.

## Application Shell

### `.app-shell`

Top-level layout wrapper for dashboard pages. It contains the fixed sidebar and the main dashboard content area.

### `.sidebar`

Fixed desktop navigation region. It contains:

- `.brand`
- `.brand-logo`
- `.brand-name`
- `.nav-menu`
- `.sidebar-footer`

### `.main-content`

Primary page content area. It offsets itself from the fixed sidebar on desktop and becomes full-width on smaller screens.

### Enterprise footer

`bi-enterprise.js` injects `#enterpriseFooter` into each dashboard page. It documents the runtime boundary directly in the UI: static GitHub Pages dashboard, local data only, and placeholder AI/export integrations.

## Navigation

### `.nav-menu`

Shared dashboard navigation list. Current primary pages:

- Executive Overview
- Sales Performance
- Sales Analytics
- Product Intelligence
- Dealer Intelligence
- Sales Forecast AI

`bi-core.js` marks the current page link as active through `initNavigation()`.

### `.nav-icon`

Icon container inside navigation items. Current pages use inline emoji icons. Future icon changes should be applied consistently across all dashboard pages.

## Headers

### `.page-head`

Header pattern used by Executive Overview, Sales Performance, and Sales Analytics.

### `.topbar`

Header pattern used by Product Intelligence, Dealer Intelligence, and Sales Forecast AI.

### `.top-meta`

Compact KPI metadata blocks in topbar pages. Used for record count, best dealer, forecast confidence, refresh time, and similar page-level metadata.

## Filters

### `.filter-bar`

Shared filter container. Standard filters include:

- Year
- Month
- Week
- Dealer
- Salesman
- Product Type
- Scenario

### `.filter-group` and `.filter-item`

Filter control wrappers. Both patterns exist in the current pages and are styled by shared CSS.

### `.reset-btn` and `.filter-reset`

Primary reset buttons for filter bars.

## KPI Cards

### `.kpi-grid`

Responsive KPI card grid. Current pages commonly use six KPI cards.

### `.kpi-card`

Standard KPI card for units, sales value, gross profit, GP margin, commission, forecast, target, and similar metrics.

### `.kpi-card.teal`

Alternate KPI accent for secondary success or status metrics.

## Panels

### `.panel`

Reusable content container for charts, tables, rankings, scorecards, heatmaps, funnels, and AI summaries.

Panel structure:

```html
<div class="panel">
  <h2>Panel Title</h2>
  <p>Short supporting label</p>
  <!-- chart, table, list, or module -->
</div>
```

## Chart Containers

### `.chart-box`

Standard chart wrapper with stable height for Chart.js canvases.

### `.chart-box.small` and `.chart-box.sm`

Compact chart wrappers.

### `.chart-box.lg`

Large chart wrapper for major forecast or trend visualizations.

## Tables

### `.table-wrap`

Scrollable table container. Use it to keep tables usable on smaller screens.

### `.text-right`

Numeric alignment helper.

## Lists and Rankings

### `.list`

Generic list target used by several pages for region, contribution, ranking, or breakdown content.

### `.clean-list`

Clean vertical list style used by Product, Dealer, and Forecast pages.

### `BI.core.renderRankList()`

Shared JS helper for ranked rows with unit count, GP percentage, share, and bar visualization.

## AI Summary Strip

### `.ai-strip`

Horizontal summary strip used for AI-style observations and recommendations.

### `.ai-bot`

Visual marker for the strip.

### `.ai-item` and `.ai-card`

Reusable summary cells containing a strong value and supporting label.

## V6 Executive Intelligence Components

### `BI.enterprise.components.el(tag, className, html)`

Small shared DOM factory used by the v5 foundation. It is intentionally simple so it works in static pages without a framework or build step.

### `.v6-briefing`

Executive-only AI Executive Briefing used by `dashboard/executive.html`. It contains:

- `.briefing-main` for the top performance signal and recommended action.
- `.briefing-grid` for main risk, dealer to watch, product to push, and salesman signal cards.
- `.command-chip-row` and `.command-chip` for compact forecast, gap, and dependency signals.

All briefing content is generated from filtered `dashboard/data/dashboard_data.json` in `dashboard/js/executive.js`. It does not call external APIs.

### `.v6-cockpit-grid` and `.v6-panel`

Executive cockpit layout for the V6 page. Current cockpit panels include:

- KPI Wall.
- Sales Trend Chart.
- Dealer Ranking Chart.
- Product Mix Chart.
- GP / Margin Quality Panel.
- Booking / Pipeline Panel.
- Forecast Gap Panel.
- Risk & Opportunity Panel.
- Executive Alert Center.

Use `.v6-panel.span-2` for major desktop panels such as the sales trend chart. Panels collapse to one column on mobile.

### `.drill-card`

Clickable executive summary cards used for dealer and product drill-downs. Dealer cards link to `dealer.html`; product cards link to `product.html`.

### `.alert-center-grid` and `.alert-card`

Executive Alert Center grid. Alert cards use `.green`, `.yellow`, and `.red` severity classes for GP risk, dealer concentration risk, forecast gap risk, and stock / booking signal.

### `.quality-grid` and `.quality-card`

Margin quality card grid used for GP margin, lowest-margin model, best-GP model, and product mix watch signals.

### `.export-center-v6`

Executive export placeholder band for PDF, PowerPoint, Excel, and PNG. Buttons use the shared `data-enterprise-export` handler and show `V6 Export Center prepared.`

V7.1 keeps the class for compatibility and upgrades the behavior:

- Excel button downloads a CSV executive summary from current filtered rows.
- PNG button attempts a browser-native dashboard capture.
- PDF button shows `PDF export is prepared for V7.2.`
- PowerPoint button shows `PowerPoint export is prepared for V7.2.`

### `.report-center-v71`

Executive-only Production Report Center on `dashboard/executive.html`. It contains Weekly Report, Monthly Report, Executive Summary, and Dealer Review buttons. Buttons use `data-enterprise-report` and open the shared report modal with rule-based text from filtered `dashboard/data/dashboard_data.json` rows.

### `.report-actions-v71` and `.report-button-v71`

Responsive report action grid and button style for executive report generation. Buttons wrap to one column on mobile and use existing orange, navy, green, blue, and white design tokens.

### `.enterprise-modal-backdrop`, `.enterprise-modal-panel`, and `.enterprise-report-body`

Shared modal report pattern used by V7.1 report generation. The modal is generated by `dashboard/js/bi-enterprise.js`, uses escaped text, and does not call an external AI API.

### `body.presentation-mode`

Presentation Mode class toggled from the executive header. It hides the sidebar, suppresses the filter bar, expands `.main-content`, and can be toggled back without changing filters, data, or routes.

### `.executive-command-center`

Legacy V5.2 command center class retained for backwards compatibility with shared enterprise styles. Prefer `.v6-briefing` and `.v6-cockpit-grid` for new executive cockpit work.

### `.executive-snapshot-grid`

Legacy executive snapshot row retained for compatibility. New executive snapshots should be implemented inside `.v6-cockpit-grid`.

### `.enterprise-intelligence-deck`

Shared Enterprise Intelligence area injected after each page's existing KPI grid by `dashboard/js/bi-enterprise.js`. It renders page-specific enterprise panels from filtered `dashboard_data.json`.

Current page coverage:

- Executive KPI Wall, Executive Summary Panel, Alert Center, Top Risks, Next Actions, Dealer Performance Snapshot, Product Performance Snapshot, and Monthly Gap / Forecast placeholder.
- Sales KPI Wall, Sales Funnel placeholder, Sales Trend comparison, Booking / Landing placeholder, Sales Source analysis, AI Sales Insight panel, and action recommendation cards.
- Salesman KPI Wall, Coaching Insight panel, Salesman Ranking, Performance Matrix placeholder, Product Specialization summary, Lead Source insight, and action recommendation cards.
- Product KPI Wall, Model Ranking highlight, Product Mix insight, Slow-moving / risk placeholder, and product recommendation cards.
- Dealer KPI Wall, Dealer Score placeholder, Dealer Ranking, Dealer Health insight, and dealer action cards.
- Forecast KPI Wall, Forecast vs Actual section, Gap Analysis panel, Risk / Opportunity insight, and Forecast Confidence placeholder.

### `.enterprise-kpi-wall` and `.intel-value-card`

Dense KPI wall used inside the Enterprise Intelligence deck. Cards summarize filtered units, sales value, GP margin, top dealer, top model, and rule-based forecast.

### `.enterprise-intel-grid` and `.intel-panel`

Responsive module grid and panel pattern for Enterprise BI content. Use `.intel-panel.wide` for an important insight panel that should span two desktop columns.

### `.intel-alert-card`, `.intel-action-card`, `.intel-placeholder-card`

Shared Enterprise card types for warning signals, next-best-action recommendations, and future-feature placeholders. Placeholders must remain safe and static until the future feature is implemented.

### `.enterprise-ai-engine`

Shared AI Insight Engine injected by `dashboard/js/bi-enterprise.js`. It displays six rule-based insight cards:

- Sales Performance.
- Dealer Performance.
- Product Performance.
- Forecast Risk.
- Low GP Warning.
- Top Performer.

The insight engine uses local filtered dashboard rows only. It does not call external APIs.

### `.enterprise-insight-grid` and `.enterprise-ai-card`

Responsive card grid and card pattern for rule-based AI insights. Cards stack on mobile and include severity, headline, detail, and action guidance.

### `.enterprise-foundation`

Responsive foundation area injected after each page's existing `.ai-strip` and insight engine. It contains dashboard module readiness and export placeholder controls.

### `.insight-card`

Rule-based AI intelligence card. Current supported insight labels:

- Executive Summary.
- Sales Coaching Insight.
- Product Recommendation.
- Dealer Health Insight.
- Forecast Recommendation.
- KPI Alert Center.

The card uses filtered rows from `dashboard/data/dashboard_data.json`. It does not call external APIs.

### `.module-pills` and `.module-pill`

Dashboard framework status indicators for:

- Landing Dashboard.
- Booking Dashboard.
- Inventory Dashboard.
- Finance Dashboard.
- Dealer KPI.
- Salesman KPI.

These are framework markers, not new routes yet. Existing six dashboard paths remain unchanged.

### `.export-actions` and `.export-button`

Visible export-ready controls for PDF, PowerPoint, Excel, and PNG. V7.1 handlers download CSV for Excel, attempt PNG capture for the dashboard area, and keep PDF/PowerPoint as explicit V7.2 placeholders.

## V7.1 Extension Rules

- Keep AI insights deterministic and rule-based unless an approved future architecture adds a service layer.
- Keep PDF and PowerPoint exports as placeholders until a reviewed static export implementation replaces the V7.2 roadmap behavior.
- Keep CSV and PNG exports lightweight, browser-native, and safe for GitHub Pages.
- Do not modify `dashboard/data/dashboard_data.json` to support UI-only enhancements.
- Do not modify `tools/update_dashboard.py` unless a data contract change is explicitly requested.
- Preserve no-npm, no-build, static GitHub Pages compatibility.
- Test desktop and mobile widths for no horizontal overflow, wrapped buttons, and contained chart panels.
- V8 multi-company work should add tenant-safe data contracts before adding company-level UI or exports.

## Specialized Modules

The current dashboards include specialized module targets:

- Product matrix.
- Regional heatmap.
- Dealer radar scorecard.
- Dealer funnel.
- Forecast funnel.
- Probability chart.
- Activity heatmap.
- Business health gauge.
- Score grids.

These should remain page-specific until the same visual pattern is needed across multiple dashboards. Once reused, move shared styling and helper behavior into the v4 shared CSS and JS modules.

## Component Extension Rules

- Reuse existing classes before creating new ones.
- Add new shared components only when at least two pages need them.
- Keep component naming descriptive and dashboard-oriented.
- Keep dimensions stable so charts, labels, and dynamic values do not shift the page layout unexpectedly.
- Test components on desktop, tablet, and mobile widths.
- Keep AI and export work front-end only unless a future architecture decision explicitly adds a backend or external service.
