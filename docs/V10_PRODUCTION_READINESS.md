# KMM Sales Intelligence V10 Production Readiness

## Deployment Checklist

- Confirm the branch is `feature/v10-production-release`.
- Confirm `dashboard/data/dashboard_data.json` is generated and reviewed before deployment.
- Confirm `tools/update_dashboard.py` was not changed for the release.
- Open `dashboard/login.html` through a static web server, not a direct file URL.
- Log in with an approved internal static credential.
- Confirm Thai is the default language and English remains selectable.
- Smoke test `settings.html`, `executive.html`, `sales.html`, `salesman.html`, `product.html`, `dealer.html`, and `forecast.html`.
- Confirm CSV export downloads a `kmm-v10-executive-summary.csv` file.
- Confirm PNG export either downloads `kmm-v10-dashboard.png` or shows a Thai failure message without a console error.
- Confirm PDF and PowerPoint buttons show Thai placeholder messages and do not attempt unsupported file generation.
- Confirm the settings page shows the internal-use security note.
- Publish the static files to GitHub Pages only after the browser console is clean.

## User Guide Summary

- Start from `dashboard/login.html`.
- Use Thai as the default operating language. Switch language from the login page, top security bar, or settings page when English is needed.
- Use the company selector in the security bar or settings page to tag the active session company.
- Use filters on each dashboard page to narrow year, month, week, dealer, salesman, and product type.
- Use Executive Overview for leadership KPI, report, export, AI Copilot, alert, and forecast signals.
- Use Sales, Salesman, Product, Dealer, and Forecast pages for operational drill-downs.
- Use the Report Center to generate weekly, monthly, executive, and dealer review text from the current filtered local data.
- Use CSV export for a lightweight summary file. Use PNG export for a browser-rendered dashboard snapshot when supported.
- Treat AI Copilot as rule-based local guidance only. It does not call any external API.

## Security Notes

- V10 keeps static credential login for temporary internal protection.
- Static credentials are visible in browser source and are not real authentication.
- Do not share credentials outside the approved internal team.
- V11 should move to real authentication, preferably identity-provider or server-backed auth with centralized user management.

## Troubleshooting

- If a page redirects to login, the session is missing, expired, or the current role does not have page access.
- If data does not load, verify `dashboard/data/dashboard_data.json` is present and served with HTTP 200.
- If charts do not render, verify `dashboard/js/chart.umd.min.js` is present and served with HTTP 200.
- If Thai text appears as mojibake in CSV, open the file as UTF-8.
- If PNG export fails, use the Thai status message as a safe fallback. Browser support for SVG `foreignObject` canvas rendering can vary.
- If a filter returns empty panels, reset filters and confirm the current data contains core product rows.
