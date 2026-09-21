/**
<<<<<<< HEAD
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
=======
 * Phase 5 — Unified investment holdings valuation & reporting.
 * Crypto + Stocks + Funds + Metals; Decimal-only; explicit valuationContext.
 */
import { openDb } from "../../persistence/port.js";
import { toDecimal } from "../../money/canonicalDecimal.js";

const FUND_QUOTE_TYPES = new Set(["nav", "liquidation", "last"]);
const METAL_UNITS = new Set(["per_mg", "per_g"]);
const METAL_PURITY = new Set(["gross", "fine"]);

/**
 * @param {string} dataDir
 * @param {object} opts
 * @param {object} [opts.valuationContext] { reportCurrency, asOf, fxRates }
 * @param {Record<string, object|string>} [opts.prices] keyed by instrumentId
 */
export function investmentHoldings(dataDir, { prices = {}, valuationContext = null } = {}) {
  const db = openDb(dataDir);
  const reportCurrency = valuationContext?.reportCurrency || null;
  const asOf = valuationContext?.asOf || null;

  function normalizePrice(raw, instrumentId, { requiredQuoteTypes = null, vertical = null } = {}) {
    if (raw == null) return null;
    let px;
    if (typeof raw === "object") {
      if (raw.price == null || raw.currency == null) {
        throw new Error("VALUATION_PRICE_INCOMPLETE:" + instrumentId);
      }
      px = {
        price: toDecimal(String(raw.price)),
        currency: raw.currency,
        quoteType: raw.quoteType || "last",
        marketDate: raw.marketDate || null,
        sourceId: raw.sourceId || null,
        unit: raw.unit || null,
        purityBasis: raw.purityBasis || null,
        degraded: false,
      };
    } else {
      if (!reportCurrency) {
        throw new Error("VALUATION_SCALAR_REQUIRES_CONTEXT:" + instrumentId);
      }
      px = {
        price: toDecimal(String(raw)),
        currency: reportCurrency,
        quoteType: "last",
        marketDate: asOf,
        sourceId: null,
        unit: null,
        purityBasis: null,
        degraded: true,
      };
    }

    if (asOf && px.marketDate && px.marketDate > asOf) {
      throw new Error("VALUATION_PRICE_AFTER_ASOF:" + instrumentId);
    }

    if (raw && typeof raw === "object" && raw.isStale === true && valuationContext?.allowStale !== true) {
      throw new Error("VALUATION_PRICE_STALE:" + instrumentId);
    }

    if (requiredQuoteTypes && !requiredQuoteTypes.has(px.quoteType)) {
      throw new Error("FUND_VALUATION_QUOTE_TYPE_INVALID:" + px.quoteType);
    }

    if (vertical === "metals") {
      if (px.unit && !METAL_UNITS.has(px.unit)) {
        throw new Error("METAL_VALUATION_UNIT_INVALID:" + px.unit);
      }
      if (!px.purityBasis || !METAL_PURITY.has(px.purityBasis)) {
        throw new Error("METAL_VALUATION_PURITY_BASIS_REQUIRED");
      }
    }

    return px;
  }

  /** Convert amount in fromCurrency to reportCurrency using fxRates (units of report per 1 from). */
  function toReport(amount, fromCurrency) {
    if (!reportCurrency || fromCurrency === reportCurrency) return toDecimal(amount);
    const rate = valuationContext?.fxRates?.[fromCurrency];
    if (rate == null || rate === "") throw new Error("VALUATION_FX_MISSING:" + fromCurrency);
    return toDecimal(amount).times(toDecimal(String(rate)));
  }

  function valuedRow({
    vertical,
    instrumentId,
    quantity,
    cost,
    costCurrency,
    marketNative,
    priceCurrency,
    valuationMeta,
    extra = {},
  }) {
    let market = null;
    let unrealized = null;
    if (marketNative != null) {
      market = reportCurrency ? toReport(marketNative.toFixed(), priceCurrency) : marketNative;
      const costReport = reportCurrency ? toReport(cost.toFixed(), costCurrency) : cost;
      unrealized = market.minus(costReport);
    }
    return {
      vertical,
      instrumentId,
      quantity: typeof quantity === "string" ? quantity : quantity.toFixed(),
      cost: cost.toFixed(),
      costCurrency,
      marketValue: market != null ? market.toFixed() : null,
      unrealizedPnl: unrealized != null ? unrealized.toFixed() : null,
      valuation: valuationMeta,
      ...extra,
    };
  }

  // --- Crypto ---
  const crypto = db.prepare(`SELECT * FROM inv_crypto_holdings`).all().map((h) => {
    const qty = toDecimal(h.quantity || "0");
    const cost = toDecimal(h.total_invested || "0");
    const costCcy = h.cost_currency;
    const px = normalizePrice(prices[h.instrument_id], h.instrument_id);
    let marketNative = null;
    let valuationMeta = null;
    if (px) {
      marketNative = qty.times(px.price);
      valuationMeta = {
        price: px.price.toFixed(),
        priceCurrency: px.currency,
        quoteType: px.quoteType,
        marketDate: px.marketDate,
        sourceId: px.sourceId,
        reportCurrency: reportCurrency || costCcy,
        degraded: !!px.degraded || !valuationContext,
      };
    }
    return valuedRow({
      vertical: "crypto",
      instrumentId: h.instrument_id,
      quantity: h.quantity,
      cost,
      costCurrency: costCcy,
      marketNative,
      priceCurrency: px?.currency || costCcy,
      valuationMeta,
      extra: {
        exchangeId: h.exchange_id,
        networkId: h.network_id,
        holdingId: h.id,
      },
    });
  });

  // --- Stocks Iran ---
  const stocks = db.prepare(`SELECT * FROM inv_stocks_iran_holdings`).all().map((h) => {
    const qty = toDecimal(h.quantity || "0");
    const cost = toDecimal(h.total_invested || "0");
    const costCcy = h.cost_currency;
    const px = normalizePrice(prices[h.instrument_id], h.instrument_id);
    let marketNative = null;
    let valuationMeta = null;
    if (px) {
      marketNative = qty.times(px.price);
      valuationMeta = {
        price: px.price.toFixed(),
        priceCurrency: px.currency,
        quoteType: px.quoteType,
        marketDate: px.marketDate,
        sourceId: px.sourceId,
        reportCurrency: reportCurrency || costCcy,
        degraded: !!px.degraded || !valuationContext,
      };
    }
    return valuedRow({
      vertical: "stocks",
      instrumentId: h.instrument_id,
      quantity: h.quantity,
      cost,
      costCurrency: costCcy,
      marketNative,
      priceCurrency: px?.currency || costCcy,
      valuationMeta,
      extra: {
        holdingId: h.id,
        brokerageId: h.brokerage_id,
        accountId: h.account_id,
        symbol: h.symbol,
        isin: h.isin,
        market: h.market,
        name: h.name,
      },
    });
  });

  // --- Funds ---
  const funds = db.prepare(`SELECT * FROM inv_fif_holdings`).all().map((h) => {
    const qty = toDecimal(h.quantity || "0");
    const cost = toDecimal(h.total_invested || "0");
    const costCcy = h.cost_currency;
    const px = normalizePrice(prices[h.instrument_id], h.instrument_id, {
      requiredQuoteTypes: FUND_QUOTE_TYPES,
    });
    let marketNative = null;
    let valuationMeta = null;
    if (px) {
      marketNative = qty.times(px.price);
      valuationMeta = {
        price: px.price.toFixed(),
        priceCurrency: px.currency,
        quoteType: px.quoteType,
        marketDate: px.marketDate,
        sourceId: px.sourceId,
        reportCurrency: reportCurrency || costCcy,
        degraded: !!px.degraded || !valuationContext,
      };
    }
    return valuedRow({
      vertical: "funds",
      instrumentId: h.instrument_id,
      quantity: h.quantity,
      cost,
      costCurrency: costCcy,
      marketNative,
      priceCurrency: px?.currency || costCcy,
      valuationMeta,
      extra: {
        holdingId: h.id,
        accountId: h.account_id,
        brokerageId: h.brokerage_id,
      },
    });
  });

  // --- Metals ---
  const metals = db.prepare(`SELECT * FROM inv_metals_holdings`).all().map((h) => {
    const qtyMg = toDecimal(h.quantity_mg || "0");
    const purityRatio = toDecimal(h.purity_ratio || "1");
    const cost = toDecimal(h.total_invested || "0");
    const costCcy = h.cost_currency;
    const px = normalizePrice(prices[h.instrument_id], h.instrument_id, { vertical: "metals" });
    let marketNative = null;
    let valuationMeta = null;
    if (px) {
      const unit = px.unit || "per_mg";
      let pricePerMg = px.price;
      if (unit === "per_g") {
        pricePerMg = px.price.div(toDecimal("1000"));
      }
      const weightMg =
        px.purityBasis === "fine" ? qtyMg.times(purityRatio) : qtyMg;
      marketNative = weightMg.times(pricePerMg);
      valuationMeta = {
        price: px.price.toFixed(),
        priceCurrency: px.currency,
        quoteType: px.quoteType,
        marketDate: px.marketDate,
        sourceId: px.sourceId,
        unit,
        purityBasis: px.purityBasis,
        purityRatio: purityRatio.toFixed(),
        valuedWeightMg: weightMg.toFixed(),
        reportCurrency: reportCurrency || costCcy,
        degraded: !!px.degraded || !valuationContext,
      };
    }
    return valuedRow({
      vertical: "metals",
      instrumentId: h.instrument_id,
      quantity: h.quantity_mg,
      cost,
      costCurrency: costCcy,
      marketNative,
      priceCurrency: px?.currency || costCcy,
      valuationMeta,
      extra: {
        holdingId: h.id,
        platformId: h.platform_id,
        quantityUnit: "mg",
        purityCode: h.purity_code,
        purityRatio: h.purity_ratio,
      },
    });
  });

  const all = [...crypto, ...stocks, ...funds, ...metals];
  let totalCost = toDecimal("0");
  let totalMarket = toDecimal("0");
  let totalUnrealized = toDecimal("0");
  let valuedCount = 0;
  const costCurrencies = new Set(all.map((r) => r.costCurrency).filter(Boolean));
  const mixedCostWithoutReport = !reportCurrency && costCurrencies.size > 1;
  const costByCurrency = {};
  for (const row of all) {
    const ccy = row.costCurrency || "UNKNOWN";
    costByCurrency[ccy] = toDecimal(costByCurrency[ccy] || "0").plus(toDecimal(row.cost)).toFixed();
  }
  for (const row of all) {
    if (reportCurrency) {
      totalCost = totalCost.plus(toReport(row.cost, row.costCurrency));
    } else if (!mixedCostWithoutReport) {
      totalCost = totalCost.plus(toDecimal(row.cost));
    }
    if (row.marketValue != null) {
      valuedCount += 1;
      if (reportCurrency || !mixedCostWithoutReport) {
        totalMarket = totalMarket.plus(toDecimal(row.marketValue));
        totalUnrealized = totalUnrealized.plus(toDecimal(row.unrealizedPnl || "0"));
      }
    }
  }

  return {
    crypto,
    stocks,
    funds,
    metals,
    holdings: all,
    totals: {
      totalCost: mixedCostWithoutReport ? null : totalCost.toFixed(),
      totalMarketValue: mixedCostWithoutReport ? null : totalMarket.toFixed(),
      totalUnrealizedPnl: mixedCostWithoutReport ? null : totalUnrealized.toFixed(),
      costByCurrency,
      mixedCurrencyWithoutReportCurrency: mixedCostWithoutReport,
      valuedCount,
      holdingCount: all.length,
    },
    valuationContext: valuationContext || { degraded: true, note: "no valuationContext" },
  };
}

export function investmentRealizedPnl(dataDir, { fromDate = null, toDate = null } = {}) {
  const db = openDb(dataDir);
  let sql = `
    SELECT jl.side, jl.amount, jl.amount_in_base, je.business_date
    FROM fin_journal_lines jl
    JOIN fin_journal_entries je ON je.id = jl.entry_id
    WHERE jl.account_id LIKE '%realized_pnl%'`;
  const params = [];
  if (fromDate) {
    sql += ` AND je.business_date >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    sql += ` AND je.business_date <= ?`;
    params.push(toDate);
  }
  const rows = db.prepare(sql).all(...params);
  let net = toDecimal("0");
  for (const r of rows) {
    const amt = toDecimal(r.amount_in_base || r.amount);
    if (r.side === "credit") net = net.plus(amt);
    else net = net.minus(amt);
  }
  return { netRealizedPnl: net.toFixed(), lines: rows.length };
}
>>>>>>> origin/main
