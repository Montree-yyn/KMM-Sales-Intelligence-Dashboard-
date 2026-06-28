# KMM Sales Intelligence Coding Standard

## Purpose

This standard keeps the dashboard codebase stable, readable, and compatible with static hosting. The project should remain easy to update from Excel and easy to deploy with GitHub Pages.

## Platform Rules

- Static HTML, CSS, and JavaScript only.
- No npm.
- No backend.
- No build tools.
- No bundlers.
- No server-only APIs.
- No generated dependency folders.
- Keep all paths compatible with GitHub Pages static hosting.

## HTML Standards

- Keep each dashboard page as a complete static HTML file.
- Use shared layout classes such as `.app-shell`, `.sidebar`, `.main-content`, `.filter-bar`, `.kpi-grid`, and `.panel`.
- Load `css/bi-core.css` for v4 dashboard pages.
- Load `js/chart.umd.min.js` before chart rendering modules.
- Load shared BI modules before the page-specific script.
- Preserve the existing sidebar navigation structure unless the navigation model is intentionally updated across all pages.

Standard script order:

```html
<script src="js/bi-utils.js"></script>
<script src="js/bi-filters.js"></script>
<script src="js/bi-charts.js"></script>
<script src="js/bi-core.js"></script>
<script src="js/page-name.js"></script>
```

## CSS Standards

- Prefer shared CSS in `dashboard/css/design-system.css`, `bi-layout.css`, `bi-components.css`, and `bi-modules.css`.
- Use CSS variables from `design-system.css`.
- Do not duplicate design tokens in page-specific files.
- Keep responsive behavior aligned with the shared breakpoints.
- Avoid one-off visual treatments that make pages feel unrelated.

## JavaScript Standards

- Prefer the `BI` namespace and helpers exposed by shared modules.
- Use `loadData()` or `BI.utils.loadDashboardData()` to load dashboard data.
- Use `coreData()` or `BI.utils.getCoreProductData()` for core product dashboard analysis.
- Use `fillFilters()`, `bindFilters()`, and `filteredData()` for standard filter behavior.
- Use `chart()` or `BI.charts.renderChart()` for Chart.js rendering.
- Destroy or replace existing chart instances through shared helpers instead of creating duplicate charts.
- Keep page-specific scripts focused on transforming filtered data into page UI.

## Data Handling Standards

- Treat `dashboard/data/dashboard_data.json` as generated data.
- Do not edit generated JSON by hand unless explicitly asked.
- Use `tools/update_dashboard.py` to regenerate data from Excel.
- Preserve existing field names consumed by dashboards, especially `Sales Staff`, `year`, `month`, `week`, `dealer`, `region`, `type`, `model`, `msrp`, `gp1`, and `commission`.
- Normalize new data fields in the update flow before using them in dashboard pages.

## Git Workflow

Use a feature-branch workflow:

1. Start from the latest main branch.
2. Create a focused branch for the change.
3. Make small, reviewable commits.
4. Verify dashboard pages locally.
5. Open a pull request.
6. Review data diffs carefully when generated files are included.
7. Merge only after review and validation.

## Branch Naming

Recommended branch format:

```text
codex/<short-change-name>
feature/<short-feature-name>
fix/<short-bug-name>
docs/<short-doc-name>
data/<data-refresh-date-or-scope>
```

Examples:

- `docs/project-documentation`
- `feature/landing-dashboard`
- `fix/mobile-filter-layout`
- `data/2026-june-refresh`

## Pull Request Process

Each pull request should include:

- Summary of what changed.
- Dashboard pages affected.
- Data files affected, if any.
- Screenshots or notes for visual changes.
- Testing performed.
- Confirmation that GitHub Pages compatibility is preserved.

For data update pull requests, include:

- Source workbook used.
- Record count exported.
- Any schema changes.
- Any normalization changes.

## Review Checklist

- Pages still load as static files.
- No npm or build tooling was introduced.
- `dashboard_data.json` was changed only when intended.
- `tools/update_dashboard.py` was changed only when intended.
- Shared design system is used.
- Mobile layout remains usable.
- Charts render without duplicate instances.
- Filters apply consistently.
- Navigation remains valid.

