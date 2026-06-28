import json
from pathlib import Path

import pandas as pd


INPUT_FILE = "data/2026_KMM_CPI.xlsx"
SHEET_NAME = "2026_KMM_DATA"
OUTPUT_FILE = "dashboard/data/dashboard_data.json"

COMMISSION_COLUMNS = [
    "Volume Incentive",
    "Model Incentive",
    "Special Incentive (Cash)",
    "Broker",
    "Admin Commission",
    "Admin Member Plus",
    "Leader Com",
]


def safe_text(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def safe_number(value):
    if pd.isna(value):
        return 0
    try:
        return float(value)
    except Exception:
        return 0


def get_value(row, columns, default=""):
    for col in columns:
        if col in row.index:
            value = row[col]
            if not pd.isna(value) and str(value).strip() != "":
                return value
    return default


def normalize_type(value):
    text = safe_text(value).upper()

    mapping = {
        "01-TT": "Tractor (TT)",
        "TT": "Tractor (TT)",
        "TRACTOR": "Tractor (TT)",

        "02-CH": "Combine Harvester (CH)",
        "CH": "Combine Harvester (CH)",
        "COMBINE": "Combine Harvester (CH)",
        "COMBINE HARVESTER": "Combine Harvester (CH)",

        "03-EX": "Excavator (EX)",
        "EX": "Excavator (EX)",
        "EXCAVATOR": "Excavator (EX)",

        "04-TP": "Transplanter (TP)",
        "TP": "Transplanter (TP)",
        "TRANSPLANTER": "Transplanter (TP)",
        "POWER TILLER": "Transplanter (TP)",

        "05-TX": "Used Tractor (TX)",
        "TX": "Used Tractor (TX)",
        "USED TRACTOR": "Used Tractor (TX)",

        "06-IM": "Implement (IM)",
        "IM": "Implement (IM)",
        "IMPLEMENT": "Implement (IM)",

        "07-IMO": "Implement Other (IMO)",
        "IMO": "Implement Other (IMO)",
        "IMPLEMENT OTHER": "Implement Other (IMO)",

        "08-OT": "Other (OT)",
        "OT": "Other (OT)",
        "OTHER": "Other (OT)",
    }

    return mapping.get(text, safe_text(value))


def normalize_model(model):
    original = safe_text(model)

    if not original:
        return ""

    key = original.upper()
    key = key.replace(" ", "")
    key = key.replace("-", "")
    key = key.replace("_", "")
    key = key.replace("+", "")
    key = key.replace(".", "")

    alias = {
        # Combine Harvester
        "DC70GPRO": "DC70G Pro",
        "DC70G": "DC70G Pro",
        "DC70GPRONEW": "DC70G Pro",

        # Tractor
        "M6040HIFD": "M6040HI+FD",
        "M6040FD": "M6040+FD",

        "M6240HIFD": "M6240HI+FD",
        "M6240SUFD": "M6240SU+FD",
        "M6240FD": "M6240+FD",

        "M7040FD": "M7040+FD",

        "M8540FD": "M8540+FD",

        "M9540FD": "M9540+FD",

        "L5018FD": "L5018+FD",
        "L5018SD": "L5018+SD",

        "MU5702FD": "MU5702+FD",
    }

    return alias.get(key, original)


def build_commission(row):
    return sum(
        safe_number(get_value(row, [col]))
        for col in COMMISSION_COLUMNS
    )


def main():
    df = pd.read_excel(INPUT_FILE, sheet_name=SHEET_NAME, header=3)

    records = []

    for _, row in df.iterrows():
        ref = safe_text(get_value(row, ["REF_CODE", "Ref", "REF", "ref"]))

        if not ref:
            continue

        year = safe_number(get_value(row, ["KMM Year", "Year", "year"]))
        month = safe_number(get_value(row, ["KMM RS", "Month", "month"]))

        if month > 100:
            month = int(month) % 100

        raw_model = safe_text(get_value(row, ["MODEL", "Model", "model"]))
        commission = build_commission(row)

        record = {
            "ref": ref,
            "dealer": safe_text(get_value(row, ["Dealer", "dealer"])),
            "Sales Staff": safe_text(get_value(row, ["Sales Staff", "SL Name", "Salesman"])),
            "source": safe_text(get_value(row, [
                "Source (ที่มาลูกค้า)",
                "Source",
                "SOURCE",
                "Lead Source",
                "Customer Source",
                "ที่มาลูกค้า"
             ])),
            "year": year,
            "month": month,
            "monthYear": f"{int(year)}-{int(month):02d}" if year and month else "",
            "week": safe_text(get_value(row, ["Week", "week"])),
            "region": safe_text(get_value(row, ["States / Division / Region", "Region", "region"])),
            "type": normalize_type(get_value(row, ["TYPE", "Type", "type"])),
            "subtype": safe_text(get_value(row, ["SUB_TYPE", "Subtype", "subtype"])),
            "model": normalize_model(raw_model),
            "purchaseType": safe_text(get_value(row, ["Purchase Type", "purchaseType"])),
            "payment": safe_text(get_value(row, ["Payment", "payment"])),
            "msrp": safe_number(get_value(row, ["MSRP (MMK)", "MSRP", "msrp"])),
            "netReceived": safe_number(get_value(row, ["Net Received", "netReceived"])),
            "totalExpense": safe_number(get_value(row, ["Total Expense", "totalExpense"])),
            "gp1": safe_number(get_value(row, ["GP1", "gp1"])),
            "costMMK": safe_number(get_value(row, ["Cost MMK", "costMMK"])),
            "commission": commission,
            
        }

        records.append(record)

    Path(OUTPUT_FILE).parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(records, file, ensure_ascii=False, indent=2)

    print(f"Exported {len(records):,} records to {OUTPUT_FILE}")
    print("Done.")


if __name__ == "__main__":
    main()