(function (window) {
  "use strict";

  const CORE_PRODUCT_TYPES = [
    "Tractor (TT)",
    "Combine Harvester (CH)",
    "Excavator (EX)",
    "Transplanter (TP)",
    "Used Tractor (TX)"
  ];

  const PRODUCT_TYPE_MAP = {
    TT: "Tractor (TT)",
    TRACTOR: "Tractor (TT)",
    "TRACTOR (TT)": "Tractor (TT)",
    CH: "Combine Harvester (CH)",
    COMBINE: "Combine Harvester (CH)",
    "COMBINE HARVESTER": "Combine Harvester (CH)",
    "COMBINE HARVESTER (CH)": "Combine Harvester (CH)",
    EX: "Excavator (EX)",
    EXCAVATOR: "Excavator (EX)",
    "EXCAVATOR (EX)": "Excavator (EX)",
    TP: "Transplanter (TP)",
    "POWER TILLER": "Transplanter (TP)",
    "POWER TILLER (TP)": "Transplanter (TP)",
    TRANSPLANTER: "Transplanter (TP)",
    "TRANSPLANTER (TP)": "Transplanter (TP)",
    TX: "Used Tractor (TX)",
    USED: "Used Tractor (TX)",
    "USED TRACTOR": "Used Tractor (TX)",
    "USED TRACTOR (TX)": "Used Tractor (TX)"
  };

  /*
   * V16 KPI Dictionary
   * Data flow: Excel / existing data engine -> V16DataAdapter -> KPI engine
   * -> chart data builders -> UI components.
   */
  const KPI_DICTIONARY = {
    sales: {
      definition: "Delivered sales quantity or value based on existing delivery/sales data.",
      chart: "line / KPI card / ranking",
      ownerPage: "Sales"
    },
    booking: {
      definition: "Confirmed booking quantity or value.",
      chart: "KPI card / trend / conversion",
      ownerPage: "Focus / Sales",
      requiredFields: ["bookingDate", "bookingStatus"]
    },
    delivery: {
      definition: "Units delivered from booking or stock.",
      chart: "KPI card / trend / progress",
      ownerPage: "Focus",
      requiredFields: ["deliveryDate", "deliveryStatus"]
    },
    landing: {
      definition: "Stock arrival / incoming goods.",
      chart: "KPI card / timeline",
      ownerPage: "Stock",
      requiredFields: ["landingDate", "etaDate", "shipmentStatus"]
    },
    collection: {
      definition: "Payment collected or collection progress.",
      chart: "KPI card / progress",
      ownerPage: "Focus / Sales",
      requiredFields: ["collectionAmount", "collectionDate"]
    },
    forecast: {
      definition: "Estimated month-end performance.",
      chart: "KPI card / line / gap",
      ownerPage: "Focus / Sales"
    },
    pipeline: {
      definition: "Active sales opportunities by stage.",
      chart: "funnel",
      ownerPage: "Sales / Market",
      requiredFields: ["opportunityStage", "opportunityValue"]
    },
    stockAging: {
      definition: "Stock age grouped by period.",
      chart: "stacked bar or heatmap table",
      ownerPage: "Stock",
      requiredFields: ["stockAgeDays", "receivedDate"]
    },
    salesHealthScore: {
      definition: "Composite health score from sales, booking, delivery, collection, stock and forecast.",
      chart: "radial gauge",
      ownerPage: "Focus"
    }
  };

  function normalizeProductType(type) {
    const value = String(type || "").trim();
    return PRODUCT_TYPE_MAP[value.toUpperCase()] || value;
  }

  function normalizeRow(row) {
    return Object.assign({}, row, {
      type: normalizeProductType(row.type),
      year: Number(row.year) || row.year,
      month: Number(row.month) || row.month,
      netReceived: Number(row.netReceived) || 0,
      gp1: Number(row.gp1) || 0,
      msrp: Number(row.msrp) || 0,
      costMMK: Number(row.costMMK) || 0,
      commission: Number(row.commission) || 0
    });
  }

  function fromRows(rows) {
    const normalizedRows = Array.isArray(rows) ? rows.map(normalizeRow) : [];
    return {
      rows: normalizedRows,
      coreRows: normalizedRows.filter(row => CORE_PRODUCT_TYPES.includes(row.type)),
      kpis: KPI_DICTIONARY
    };
  }

  window.V16DataAdapter = { fromRows, KPI_DICTIONARY };
})(window);
