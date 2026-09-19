/**
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
  for (const row of all) {
    if (reportCurrency) {
      totalCost = totalCost.plus(toReport(row.cost, row.costCurrency));
    } else {
      // without report currency, cost totals only when single currency — skip mixed
      totalCost = totalCost.plus(toDecimal(row.cost));
    }
    if (row.marketValue != null) {
      valuedCount += 1;
      totalMarket = totalMarket.plus(toDecimal(row.marketValue));
      totalUnrealized = totalUnrealized.plus(toDecimal(row.unrealizedPnl || "0"));
    }
  }

  return {
    crypto,
    stocks,
    funds,
    metals,
    holdings: all,
    totals: {
      totalCost: totalCost.toFixed(),
      totalMarketValue: totalMarket.toFixed(),
      totalUnrealizedPnl: totalUnrealized.toFixed(),
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
