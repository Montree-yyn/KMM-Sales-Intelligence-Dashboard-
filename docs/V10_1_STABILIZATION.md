# V10.1 Stabilization

## Purpose

V10.1 stabilizes the existing static V10 production dashboard without changing the data pipeline, backend model, or page architecture.

## Scope Completed

- Thai is the default dashboard language.
- Static HTML text and JS-generated dashboard text are covered by the shared i18n layer.
- Executive, Sales, Salesman, Product, Dealer, Forecast, Login, Settings, Export Center, Report Center, and AI Copilot labels are localized for Thai use.
- Login/session/logout flow keeps credentials out of `sessionStorage`; legacy password fields are removed if found in an existing session.
- Settings supports language, company, role, timeout, theme, and version review in the current browser session.
- Thai readability is improved through shared font, line-height, wrapping, sidebar, button, and mobile overflow rules.
- Export Center keeps PDF and PowerPoint as clear placeholders; CSV downloads a summary file; PNG attempts a browser-side dashboard capture.
- Report Center generates local Thai report summaries from filtered dashboard data.
- AI Copilot uses local rule-based answers and Thai preset questions. No external AI API is used.

## Protected Files

These files remain generated or controlled and should not be modified during V10.1 stabilization:

- `dashboard/data/dashboard_data.json`
- `tools/update_dashboard.py`

## Remaining Limitations

- Authentication is still static browser-side protection for internal use only.
- PDF and PowerPoint export remain prepared placeholders for a future authenticated/export-capable release.
- PNG export depends on browser support for rendering cloned dashboard DOM into an image.
- All dashboard data still comes from the static `dashboard_data.json` file.
