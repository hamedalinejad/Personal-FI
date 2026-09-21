/**
 * Unified investment holdings valuation.
 * BUG-P0-01 / BUG-P0-02: never subtract/aggregate incompatible currencies;
 * never report "ready" on partial valuation.
 */

import { toDecimal, canonicalDecimalString } from "../../money/canonicalDecimal.js";

/** @typedef {"loading"|"ready"|"partial_valuation"|"unpriced"|"missing_fx"|"mixed_currency_needs_report_currency"|"stale"|"error"|"invalid_context"} ValuationState */

/**
 * @param {object} opts
 * @param {Array<object>} opts.holdings  raw holding rows with costCurrency, quantity, costBasis
 * @param {Map<string, { price: string, currency: string, asOf: string, stale?: boolean }>} opts.prices  instrumentId -> price
 * @param {string|null} opts.reportCurrency
 * @param {Map<string, string>} [opts.fxToReport]  fromCurrency -> rate to reportCurrency
 * @param {string} [opts.asOf]  YYYY-MM-DD
 * @param {boolean} [opts.allowStale]
 */
export function valueHoldings(opts) {
  const {
    holdings = [],
    prices = new Map(),
    reportCurrency = null,
    fxToReport = new Map(),
    asOf = null,
    allowStale = false,
  } = opts;

  if (!Array.isArray(holdings)) {
    return {
      state: /** @type {ValuationState} */ ("invalid_context"),
      rows: [],
      totals: null,
      reason: "HOLDINGS_NOT_ARRAY",
    };
  }

  if (holdings.length === 0) {
    return {
      state: /** @type {ValuationState} */ ("ready"),
      rows: [],
      totals: { marketValue: "0", cost: "0", unrealizedPnl: "0", currency: reportCurrency || null },
      reason: null,
    };
  }

  const rows = [];
  let valuedCount = 0;
  let unpricedCount = 0;
  let missingFxCount = 0;
  let staleCount = 0;
  let mixedWithoutReport = false;
  const costCurrencies = new Set();
  const priceCurrencies = new Set();

  for (const h of holdings) {
    const instrumentId = h.instrumentId || h.instrument_id;
    const qty = toDecimal(h.quantity || "0");
    const costBasis = toDecimal(h.costBasis || h.cost_basis || "0");
    const costCurrency = h.costCurrency || h.cost_currency || null;
    if (costCurrency) costCurrencies.add(costCurrency);

    const priceObs = prices.get(instrumentId) || prices.get(h.symbol) || null;
    let row = {
      instrumentId,
      symbol: h.symbol || null,
      assetClass: h.assetClass || h.asset_class || null,
      quantity: canonicalDecimalString(qty.toFixed()),
      costBasis: canonicalDecimalString(costBasis.toFixed()),
      costCurrency,
      marketValue: null,
      marketCurrency: null,
      unrealizedPnl: null,
      valuationState: /** @type {string} */ ("unpriced"),
      reason: null,
    };

    if (!priceObs || priceObs.price == null || priceObs.price === "") {
      unpricedCount += 1;
      row.reason = "NO_PRICE";
      rows.push(row);
      continue;
    }

    if (asOf && priceObs.asOf && priceObs.asOf > asOf) {
      row.valuationState = "error";
      row.reason = "FUTURE_PRICE";
      rows.push(row);
      continue;
    }

    if (priceObs.stale && !allowStale) {
      staleCount += 1;
      row.valuationState = "stale";
      row.reason = "STALE_PRICE";
      rows.push(row);
      continue;
    }

    const price = toDecimal(priceObs.price);
    const priceCurrency = priceObs.currency;
    if (priceCurrency) priceCurrencies.add(priceCurrency);

    const marketNative = qty.times(price);
    row.marketCurrency = priceCurrency;

    // Convert / compare only when safe
    if (reportCurrency) {
      // Convert both market and cost to reportCurrency
      let marketReport = marketNative;
      let costReport = costBasis;

      if (priceCurrency && priceCurrency !== reportCurrency) {
        const fx = fxToReport.get(priceCurrency);
        if (fx == null || fx === "") {
          missingFxCount += 1;
          row.valuationState = "missing_fx";
          row.reason = `FX_REQUIRED:${priceCurrency}->${reportCurrency}`;
          rows.push(row);
          continue;
        }
        marketReport = marketNative.times(toDecimal(fx));
      }
      if (costCurrency && costCurrency !== reportCurrency) {
        const fx = fxToReport.get(costCurrency);
        if (fx == null || fx === "") {
          missingFxCount += 1;
          row.valuationState = "missing_fx";
          row.reason = `FX_REQUIRED:${costCurrency}->${reportCurrency}`;
          rows.push(row);
          continue;
        }
        costReport = costBasis.times(toDecimal(fx));
      }

      row.marketValue = canonicalDecimalString(marketReport.toFixed());
      row.unrealizedPnl = canonicalDecimalString(marketReport.minus(costReport).toFixed());
      row.valuationState = "ready";
      valuedCount += 1;
    } else {
      // No report currency: only allow market/uPnL when price currency === cost currency
      if (!costCurrency || !priceCurrency || costCurrency !== priceCurrency) {
        mixedWithoutReport = true;
        row.marketValue = null;
        row.unrealizedPnl = null;
        row.valuationState = "mixed_currency_needs_report_currency";
        row.reason = "NEEDS_REPORT_CURRENCY";
        // still expose native market for display transparency
        row.marketNative = canonicalDecimalString(marketNative.toFixed());
        rows.push(row);
        continue;
      }
      row.marketValue = canonicalDecimalString(marketNative.toFixed());
      row.unrealizedPnl = canonicalDecimalString(marketNative.minus(costBasis).toFixed());
      row.valuationState = "ready";
      valuedCount += 1;
    }
    rows.push(row);
  }

  // Aggregate state
  /** @type {ValuationState} */
  let state = "ready";
  let reason = null;
  let totals = null;

  if (staleCount > 0 && valuedCount + unpricedCount + missingFxCount === 0) {
    state = "stale";
    reason = "ALL_STALE";
  } else if (missingFxCount > 0 && valuedCount === 0) {
    state = "missing_fx";
    reason = "FX_REQUIRED";
  } else if (mixedWithoutReport && !reportCurrency) {
    state = "mixed_currency_needs_report_currency";
    reason = "MIXED_CURRENCY";
  } else if (valuedCount === 0 && holdings.length > 0) {
    state = "unpriced";
    reason = "NO_VALUED_ROWS";
  } else if (valuedCount > 0 && valuedCount < holdings.length) {
    state = "partial_valuation";
    reason = `VALUED_${valuedCount}_OF_${holdings.length}`;
  } else if (valuedCount === holdings.length) {
    state = "ready";
  }

  // Totals only when safe
  if (state === "ready" && reportCurrency) {
    let m = toDecimal("0");
    let c = toDecimal("0");
    for (const r of rows) {
      if (r.marketValue != null) m = m.plus(toDecimal(r.marketValue));
      if (r.costBasis != null && r.costCurrency === reportCurrency) {
        c = c.plus(toDecimal(r.costBasis));
      } else if (r.costBasis != null && fxToReport.has(r.costCurrency)) {
        c = c.plus(toDecimal(r.costBasis).times(toDecimal(fxToReport.get(r.costCurrency))));
      }
    }
    totals = {
      marketValue: canonicalDecimalString(m.toFixed()),
      cost: canonicalDecimalString(c.toFixed()),
      unrealizedPnl: canonicalDecimalString(m.minus(c).toFixed()),
      currency: reportCurrency,
    };
  } else if (state === "ready" && !reportCurrency && costCurrencies.size === 1 && priceCurrencies.size <= 1) {
    const onlyCcy = [...costCurrencies][0];
    let m = toDecimal("0");
    let c = toDecimal("0");
    for (const r of rows) {
      if (r.marketValue != null) m = m.plus(toDecimal(r.marketValue));
      c = c.plus(toDecimal(r.costBasis || "0"));
    }
    totals = {
      marketValue: canonicalDecimalString(m.toFixed()),
      cost: canonicalDecimalString(c.toFixed()),
      unrealizedPnl: canonicalDecimalString(m.minus(c).toFixed()),
      currency: onlyCcy,
    };
  } else {
    totals = null; // never aggregate incompatible
  }

  return {
    state,
    rows,
    totals,
    reason,
    meta: {
      valuedCount,
      unpricedCount,
      missingFxCount,
      staleCount,
      holdingCount: holdings.length,
      costCurrencies: [...costCurrencies],
      priceCurrencies: [...priceCurrencies],
      reportCurrency,
    },
  };
}

export const VALUATION_STATES = Object.freeze([
  "loading",
  "ready",
  "partial_valuation",
  "unpriced",
  "missing_fx",
  "mixed_currency_needs_report_currency",
  "stale",
  "error",
  "invalid_context",
]);
