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

