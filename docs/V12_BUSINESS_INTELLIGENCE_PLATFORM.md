# V12 Business Intelligence Platform

## Scope

V12 adds a Thai-first Business Intelligence foundation to the existing static KMM dashboard suite. It is additive and controlled: static HTML, CSS, and JavaScript only, no backend, no npm, no build step, and no data-pipeline change.

## Data Boundary

V12 uses `dashboard/data/dashboard_data.json` only. It does not modify the JSON file and does not modify `tools/update_dashboard.py`.

The current dataset contains delivered sales records, dealer, salesman, product/model, period, sales value, GP, payment, and net received fields. It does not contain real booking ledger, current inventory ledger, salesman activity logs, or formal collection aging. For that reason, V12 labels these areas as foundations, signals, proxies, or placeholders.

## Features Added

- Booking Intelligence foundation: aging booking proxy, deposit signal, booking conversion placeholder, and dealer booking risk.
- Stock Intelligence foundation: stock aging proxy, fast moving / slow moving model signals, product availability guidance, and dealer stock risk language.
- Dealer Scorecard foundation: sales, booking proxy, stock signal, GP, collection proxy, risk level, and recommendation.
- Salesman KPI foundation: sales units, GP, booking proxy, activity placeholder, and coaching recommendation.
- Weekly Executive Briefing: Thai executive summary, key risks, key opportunities, and next actions.

## Runtime Design

`dashboard/js/bi-v12.js` exposes:

- `BI.v12.analyze(rows)` to compute deterministic BI signals from filtered dashboard rows.
- `BI.v12.render(rows, targets)` to render only the V12 sections available on the current page.

The page scripts call `BI.v12.render()` after their normal filter refresh so V12 panels always follow the active Year, Month, Week, Dealer, Salesman, and Product filters.

## Pages Updated

- `dashboard/executive.html`: full V12 platform section and weekly briefing.
- `dashboard/dealer.html`: Dealer Scorecard foundation.
- `dashboard/product.html`: Stock Intelligence foundation.
- `dashboard/salesman.html`: Salesman KPI foundation.

## Current Limitations

- Booking is a proxy from delivered unit momentum, not a real open booking ledger.
- Stock aging is a proxy from product/model sales recency, not a current inventory ledger.
- Activity is a placeholder from sales unit activity proxy, not CRM activity history.
- Collection is derived from `netReceived / sales value`, not a finance-grade aging schedule.
- Risk scoring is deterministic and rule-based; thresholds should be calibrated with management once real booking, inventory, CRM, and collection feeds are available.
