/**
 * Investment holdings report — requires explicit valuation context for unrealized P&L.
 */
import { openDb } from "../../persistence/port.js";
import { toDecimal } from "../../money/canonicalDecimal.js";

/**
 * @param {object} opts
 * @param {object} [opts.valuationContext] - { reportCurrency, asOf, fxRates?: Record<ccy, rateToReport> }
 * @param {Record<string, { price: string, currency: string, quoteType?: string, marketDate?: string, sourceId?: string }>} [opts.prices]
 */
export function investmentHoldings(dataDir, { prices = {}, valuationContext = null } = {}) {
  const db = openDb(dataDir);
  const reportCurrency = valuationContext?.reportCurrency || null;

  function normalizePrice(raw, instrumentId) {
    if (raw == null) return null;
    if (typeof raw === "object") {
      if (raw.price == null || raw.currency == null) {
        throw new Error("VALUATION_PRICE_INCOMPLETE:" + instrumentId);
      }
      return {
        price: toDecimal(raw.price),
        currency: raw.currency,
        quoteType: raw.quoteType || "last",
        marketDate: raw.marketDate || valuationContext?.asOf || null,
        sourceId: raw.sourceId || null,
      };
    }
    // Scalar only allowed when reportCurrency is known and equals cost currency path
    if (!reportCurrency) {
      throw new Error("VALUATION_SCALAR_REQUIRES_CONTEXT:" + instrumentId);
    }
    return {
      price: toDecimal(raw),
      currency: reportCurrency,
      quoteType: "last",
      marketDate: valuationContext?.asOf || null,
      sourceId: null,
      degraded: true,
    };
  }

  function toReport(amount, fromCurrency) {
    if (!reportCurrency || fromCurrency === reportCurrency) return toDecimal(amount);
    const rate = valuationContext?.fxRates?.[fromCurrency];
    if (rate == null) throw new Error("VALUATION_FX_MISSING:" + fromCurrency);
    return toDecimal(amount).times(toDecimal(rate));
  }

  const crypto = db.prepare(`SELECT * FROM inv_crypto_holdings`).all().map((h) => {
    const qty = toDecimal(h.quantity || "0");
    const cost = toDecimal(h.total_invested || "0");
    const costCcy = h.cost_currency;
    const px = normalizePrice(prices[h.instrument_id] || prices[h.instrumentId], h.instrument_id);
    let market = null;
    let unrealized = null;
    let valuationMeta = null;
    if (px) {
      if (px.currency !== costCcy && !reportCurrency) {
        throw new Error("VALUATION_CURRENCY_MISMATCH:" + h.instrument_id);
      }
      const marketNative = qty.times(px.price);
      market = reportCurrency ? toReport(marketNative.toFixed(), px.currency) : marketNative;
      const costReport = reportCurrency ? toReport(cost.toFixed(), costCcy) : cost;
      unrealized = market.minus(costReport);
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
    return {
      instrumentId: h.instrument_id,
      quantity: h.quantity,
      cost: cost.toFixed(),
      costCurrency: costCcy,
      marketValue: market ? market.toFixed() : null,
      unrealizedPnl: unrealized ? unrealized.toFixed() : null,
      valuation: valuationMeta,
    };
  });

  return {
    crypto,
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
