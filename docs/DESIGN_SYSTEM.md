# KMM Sales Intelligence Design System

## Purpose

The design system keeps all KMM Sales Intelligence dashboards visually consistent, responsive, and maintainable. All dashboard pages should use the shared v4 styles before adding page-specific CSS.

## Core CSS Bundle

Dashboard pages should load:

```html
<link rel="stylesheet" href="css/bi-core.css">
```

`bi-core.css` imports:

- `design-system.css`
- `bi-layout.css`
- `bi-components.css`
- `bi-modules.css`

## Design Tokens

Primary tokens are defined in `dashboard/css/design-system.css`.

Key variables:

- `--bi-orange`: primary KMM accent.
- `--bi-orange-2`: secondary orange accent.
- `--bi-orange-soft`: soft accent background.
- `--bi-bg`: application background.
- `--bi-surface`: translucent panel surface.
- `--bi-surface-solid`: solid white surface.
- `--bi-text`: primary text.
- `--bi-muted`: secondary text.
- `--bi-line`: standard border.
- `--bi-line-strong`: emphasized border.
- `--bi-green`: positive indicator.
- `--bi-teal`: alternate success/accent indicator.
- `--bi-yellow`: warning/accent indicator.
- `--bi-red`: risk indicator.
- `--bi-ink`: dark chart/sidebar tone.
- `--bi-shadow`: primary elevation.
- `--bi-shadow-soft`: light elevation.
- `--bi-radius`: standard radius.
- `--bi-radius-lg`: large radius.
- `--bi-sidebar`: sidebar width.
- `--bi-font`: Inter, system fonts, and Thai fallback.

## Visual Language

The v4 interface uses:

- Fixed left sidebar on desktop.
- Orange KMM accent for active states and primary actions.
- White translucent panels on a light business dashboard background.
- Strong KPI typography.
- Rounded cards and panels.
- Compact chart panels with clear section headings.
- Bilingual English and Thai labels where useful.

## Layout Standards

Use the established shell:

- `.app-shell`
- `.sidebar`
- `.main-content`
- `.page-head` or `.topbar`
- `.filter-bar`
- `.kpi-grid`
- `.grid-3` or `.module-grid`
- `.panel`

Avoid introducing a different page shell for new dashboards unless the platform architecture is intentionally revised.

## Component Standards

Use shared component classes:

- Filters: `.filter-bar`, `.filter-group`, `.filter-item`, `.reset-btn`, `.filter-reset`.
- KPIs: `.kpi-grid`, `.kpi-card`.
- Panels: `.panel`.
- Charts: `.chart-box`, `.chart-box.small`, `.chart-box.sm`, `.chart-box.lg`.
- Tables: `.table-wrap`, `.text-right`.
- Lists and dashboard modules from `bi-modules.css`.

## Mobile / Responsive Standard

All dashboards must work at common desktop, tablet, and mobile widths.

Expected behavior:

- Desktop keeps the fixed sidebar and multi-column dashboard grids.
- Medium screens reduce grid column counts.
- Small screens hide or collapse the sidebar and use single-column content.
- KPI cards stack cleanly.
- Filter controls become one column when width is constrained.
- Chart containers retain stable heights.
- Tables remain horizontally scrollable inside `.table-wrap`.
- Text must not overlap or overflow controls, cards, or chart containers.

## Chart Standards

Charts should use `dashboard/js/bi-charts.js` helpers when possible:

- Shared palette.
- Shared tooltip style.
- Shared responsive Chart.js options.
- Automatic chart replacement to prevent duplicate chart instances.

Do not create independent chart defaults unless the page requires a unique visualization that cannot use shared behavior.

## New Design Work Rules

- Always start with shared v4 tokens and components.
- Add new shared classes only when they are reusable across dashboards.
- Keep page-specific styling limited and purposeful.
- Preserve the orange, ink, teal, light-surface business dashboard identity.
- Maintain Thai text readability.
- Keep GitHub Pages compatibility.

