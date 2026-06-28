# KMM Sales Intelligence Data Structure

## Purpose

The dashboard data model is a browser-ready JSON representation of Excel sales records. It supports filtering, KPI calculation, grouping, charting, and dashboard summaries across the platform.

## Source Files

Input workbook:

```text
data/2026_KMM_CPI.xlsx
```

Input sheet:

```text
2026_KMM_DATA
```

Generated dashboard data:

```text
dashboard/data/dashboard_data.json
```

Generation script:

```text
tools/update_dashboard.py
```

## JSON Shape

`dashboard_data.json` is an array of records. Each object represents one sales record.

Current fields:

| Field | Type | Description |
| --- | --- | --- |
| `ref` | string | Reference code for the record. |
| `dealer` | string | Dealer code or name. |
| `Sales Staff` | string | Salesperson name/code. |
| `source` | string | Lead or customer source. |
| `year` | number | KMM year. |
| `month` | number | KMM month. |
| `monthYear` | string | `YYYY-MM` month key. |
| `week` | string | Week label, such as `WEEK01`. |
| `region` | string | State, division, or region. |
| `type` | string | Normalized product type. |
| `subtype` | string | Product subtype. |
| `model` | string | Normalized product model. |
| `purchaseType` | string | Purchase type. |
| `payment` | string | Payment method/type. |
| `msrp` | number | Sales value basis used by dashboards. |
| `netReceived` | number | Net received value. |
| `totalExpense` | number | Total expense. |
| `gp1` | number | Gross profit value used by dashboards. |
| `costMMK` | number | Cost in MMK. |
| `commission` | number | Total commission calculated from commission columns. |

## Product Type Normalization

`tools/update_dashboard.py` normalizes product type values into dashboard categories:

- `Tractor (TT)`
- `Combine Harvester (CH)`
- `Excavator (EX)`
- `Transplanter (TP)`
- `Used Tractor (TX)`
- `Implement (IM)`
- `Implement Other (IMO)`
- `Other (OT)`

`dashboard/js/bi-utils.js` also normalizes product types in the browser for compatibility.

## Core Product Data

Shared dashboard utilities define core product data as records with valid `type` and `model` values where `type` is included in:

- `Tractor (TT)`
- `Combine Harvester (CH)`
- `Excavator (EX)`
- `Transplanter (TP)`
- `Used Tractor (TX)`

This is exposed through:

- `BI.utils.getCoreProductData()`
- `coreData()`
- `getCoreProductData()`

## KPI Calculations

Shared KPI calculations use:

- Units: record count.
- Sales value: sum of `msrp`.
- Gross profit: sum of `gp1`.
- Commission: sum of `commission`.
- GP percentage: gross profit divided by sales value.
- Average price: sales value divided by units.

The shared helper is:

```text
BI.utils.kpi(data)
```

## Filtering Dimensions

Standard filters use:

- `year`
- `month`
- `week`
- `dealer`
- `Sales Staff`
- `type`
- `scenario` for Forecast AI UI state

Shared filter logic lives in `dashboard/js/bi-filters.js`.

## Excel Update Flow

1. Place or update the workbook at `data/2026_KMM_CPI.xlsx`.
2. Confirm the data sheet is `2026_KMM_DATA`.
3. Run:

```bash
python tools/update_dashboard.py
```

4. Confirm the export count printed by the script.
5. Review the generated `dashboard/data/dashboard_data.json` diff.
6. Open the dashboard pages and validate filters, KPIs, charts, and tables.

## Data Safety Rules

- Never modify `dashboard/data/dashboard_data.json` unless explicitly asked.
- Never modify `tools/update_dashboard.py` unless explicitly asked.
- Treat JSON as generated output.
- Treat Python update logic as a controlled data pipeline.
- Do not change field names without updating all affected dashboard pages and documentation.
- Do not introduce browser-side Excel parsing.

