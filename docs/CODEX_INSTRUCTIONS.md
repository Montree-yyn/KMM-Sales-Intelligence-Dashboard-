# Codex Instructions for KMM Sales Intelligence Platform

## Operating Principles

Codex should treat this repository as a static GitHub Pages dashboard project. The correct architecture is static HTML, CSS, JavaScript, local Chart.js, generated JSON data, and an Excel-to-JSON update script.

## Hard Rules

- Never modify `dashboard/data/dashboard_data.json` unless explicitly asked.
- Never modify `tools/update_dashboard.py` unless explicitly asked.
- Do not modify dashboard HTML, CSS, JS, data, or tools files when the user requests documentation-only work.
- Always use the shared design system for dashboard UI changes.
- Always keep GitHub Pages compatibility.
- No npm.
- No backend.
- No build tools.
- Static HTML/CSS/JS only.

## Current v4 Architecture to Respect

Primary dashboard pages:

- `dashboard/executive.html`
- `dashboard/salesman.html`
- `dashboard/sales.html`
- `dashboard/product.html`
- `dashboard/dealer.html`
- `dashboard/forecast.html`

Shared CSS:

- `dashboard/css/bi-core.css`
- `dashboard/css/design-system.css`
- `dashboard/css/bi-layout.css`
- `dashboard/css/bi-components.css`
- `dashboard/css/bi-modules.css`

Shared JS:

- `dashboard/js/bi-utils.js`
- `dashboard/js/bi-filters.js`
- `dashboard/js/bi-charts.js`
- `dashboard/js/bi-core.js`
- `dashboard/js/chart.umd.min.js`

Generated data:

- `dashboard/data/dashboard_data.json`

Excel update flow:

- `data/2026_KMM_CPI.xlsx`
- `tools/update_dashboard.py`

## Change Safety

Before editing code:

1. Inspect the current file structure.
2. Identify whether the task is documentation, UI, data, or tooling.
3. Avoid unrelated changes.
4. Preserve existing user changes.
5. Keep edits tightly scoped.

For documentation-only tasks:

- Create or update docs only.
- Do not reformat source files.
- Do not regenerate data.
- Do not run update tools unless explicitly requested.

For dashboard UI tasks:

- Start from `bi-core.css` and the shared v4 classes.
- Prefer reusable shared components.
- Keep responsive behavior intact.
- Validate the page at desktop and mobile widths when practical.

For data tasks:

- Confirm the user explicitly asked for data changes.
- Use `tools/update_dashboard.py` for JSON generation.
- Review generated JSON diffs carefully.
- Report record count and any schema impact.

For tooling tasks:

- Confirm the user explicitly asked to modify `tools/update_dashboard.py`.
- Preserve current input/output paths unless the user requests a pipeline change.
- Keep generated JSON schema compatible with existing dashboards.

## Git Workflow

Use focused branches and pull requests.

Recommended branch names:

- `codex/<short-change-name>`
- `docs/<short-doc-name>`
- `feature/<short-feature-name>`
- `fix/<short-bug-name>`
- `data/<data-refresh-scope>`

Pull requests should include:

- Summary.
- Files changed.
- Dashboard pages affected.
- Data or schema impact.
- Tests or manual verification.
- GitHub Pages compatibility confirmation.

## Implementation Preferences

- Use `rg` for searching.
- Read existing files before changing behavior.
- Use `apply_patch` for manual edits.
- Keep JavaScript compatible with direct browser execution.
- Avoid module systems or package managers.
- Use relative paths that work from static dashboard pages.
- Keep Thai and English labels readable.
- Prefer clear business dashboard language over decorative copy.

## Review Checklist

Before finishing a task, confirm:

- The requested scope was followed.
- No protected files were changed without explicit permission.
- Static hosting compatibility remains intact.
- Shared CSS and JS patterns were respected.
- Documentation was updated when architecture, data, or workflow changed.
- Mobile/responsive standards were considered for UI changes.

