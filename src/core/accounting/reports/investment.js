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
  const asOf = valuationContext?.asOf || null;

  function normalizePrice(raw, instrumentId, policy = {}) {
    if (raw == null) return null;
    if (typeof raw === "object") {
      if (raw.price == null || raw.currency == null) {
        throw new Error("VALUATION_PRICE_INCOMPLETE:" + instrumentId);
      }
      const out = {
        price: toDecimal(raw.price),
        currency: raw.currency,
        quoteType: raw.quoteType || policy.defaultQuoteType || "last",
        marketDate: raw.marketDate || asOf || null,
        sourceId: raw.sourceId || null,
        unit: raw.unit || policy.defaultUnit || "per_unit",
        purityBasis: raw.purityBasis || null,
      };
      if (asOf && out.marketDate && out.marketDate > asOf) {
        throw new Error("VALUATION_PRICE_AFTER_ASOF:" + instrumentId);
      }
      return out;
    }
    if (!reportCurrency) {
      throw new Error("VALUATION_SCALAR_REQUIRES_CONTEXT:" + instrumentId);
    }
    return {
      price: toDecimal(raw),
      currency: reportCurrency,
      quoteType: policy.defaultQuoteType || "last",
      marketDate: asOf || null,
      sourceId: null,
      unit: policy.defaultUnit || "per_unit",
      purityBasis: policy.defaultPurityBasis || null,
      degraded: true,
    };
  }

  function toReport(amount, fromCurrency) {
    if (!reportCurrency || fromCurrency === reportCurrency) return toDecimal(amount);
    const rate = valuationContext?.fxRates?.[fromCurrency];
    if (rate == null) throw new Error("VALUATION_FX_MISSING:" + fromCurrency);
    return toDecimal(amount).times(toDecimal(rate));
  }

  function finalizeHolding({
    assetClass,
    instrumentId,
    quantity,
    cost,
    costCurrency,
    price,
    marketNative,
    extra = {},
  }) {
    const costValue = toDecimal(cost || "0");
    const marketValue = marketNative == null ? null : (
      reportCurrency ? toReport(marketNative.toFixed(), price.currency) : marketNative
    );
    const costReport = reportCurrency ? toReport(costValue.toFixed(), costCurrency) : costValue;
    const unrealized = marketValue == null ? null : marketValue.minus(costReport);
    return {
      assetClass,
      instrumentId,
      quantity: quantity?.toFixed ? quantity.toFixed() : String(quantity),
      cost: costValue.toFixed(),
      costCurrency,
      marketValue: marketValue ? marketValue.toFixed() : null,
      unrealizedPnl: unrealized ? unrealized.toFixed() : null,
      valuation: price
        ? {
            price: price.price.toFixed(),
            priceCurrency: price.currency,
            quoteType: price.quoteType,
            marketDate: price.marketDate,
            sourceId: price.sourceId,
            reportCurrency: reportCurrency || costCurrency,
            unit: price.unit,
            purityBasis: price.purityBasis,
            degraded: !!price.degraded || !valuationContext,
          }
        : null,
      ...extra,
    };
  }

  const crypto = db.prepare("SELECT * FROM inv_crypto_holdings ORDER BY instrument_id, exchange_id, ifnull(network_id,'')")
    .all()
    .map((h) => {
      const qty = toDecimal(h.quantity || "0");
      const cost = toDecimal(h.total_invested || "0");
      const px = normalizePrice(prices[h.instrument_id], h.instrument_id, { defaultQuoteType: "last", defaultUnit: "per_unit" });
      if (!px) return finalizeHolding({ assetClass: "crypto", instrumentId: h.instrument_id, quantity: qty, cost, costCurrency: h.cost_currency, price: null, marketNative: null, extra: { holdingId: h.id, exchangeId: h.exchange_id, networkId: h.network_id } });
      const marketNative = qty.times(px.price);
      return finalizeHolding({ assetClass: "crypto", instrumentId: h.instrument_id, quantity: qty, cost, costCurrency: h.cost_currency, price: px, marketNative, extra: { holdingId: h.id, exchangeId: h.exchange_id, networkId: h.network_id } });
    });

  const stocks = db.prepare("SELECT * FROM inv_stocks_iran_holdings ORDER BY instrument_id, brokerage_id, ifnull(account_id,'')")
    .all()
    .map((h) => {
      const qty = toDecimal(h.quantity || "0");
      const cost = toDecimal(h.total_invested || "0");
      const px = normalizePrice(prices[h.instrument_id], h.instrument_id, { defaultQuoteType: "last", defaultUnit: "per_unit" });
      const marketNative = px ? qty.times(px.price) : null;
      return finalizeHolding({
        assetClass: "stocks",
        instrumentId: h.instrument_id,
        quantity: qty,
        cost,
        costCurrency: h.cost_currency,
        price: px,
        marketNative,
        extra: { holdingId: h.id, brokerageId: h.brokerage_id, accountId: h.account_id, symbol: h.symbol, isin: h.isin, market: h.market },
      });
    });

  const funds = db.prepare("SELECT * FROM inv_fif_holdings ORDER BY instrument_id, ifnull(brokerage_id,''), ifnull(account_id,'')")
    .all()
    .map((h) => {
      const qty = toDecimal(h.quantity || "0");
      const cost = toDecimal(h.total_invested || "0");
      const px = normalizePrice(prices[h.instrument_id], h.instrument_id, { defaultQuoteType: "nav", defaultUnit: "per_unit" });
      if (px && !["nav", "liquidation", "last"].includes(px.quoteType)) {
        throw new Error("FUND_VALUATION_QUOTE_TYPE_INVALID:" + h.instrument_id);
      }
      const marketNative = px ? qty.times(px.price) : null;
      return finalizeHolding({
        assetClass: "funds",
        instrumentId: h.instrument_id,
        quantity: qty,
        cost,
        costCurrency: h.cost_currency,
        price: px,
        marketNative,
        extra: {
          holdingId: h.id,
          brokerageId: h.brokerage_id,
          accountId: h.account_id,
          currentNav: h.current_nav,
          lastSubscriptionPrice: h.last_subscription_price,
          lastRedemptionPrice: h.last_redemption_price,
        },
      });
    });

  const metals = db.prepare("SELECT * FROM inv_metals_holdings ORDER BY instrument_id, ifnull(platform_id,''), purity_ratio")
    .all()
    .map((h) => {
      const qtyMg = toDecimal(h.quantity_mg || "0");
      const purity = toDecimal(h.purity_ratio);
      const cost = toDecimal(h.total_invested || "0");
      const px = normalizePrice(prices[h.instrument_id], h.instrument_id, {
        defaultQuoteType: "last",
        defaultUnit: "per_mg",
        defaultPurityBasis: "gross",
      });
      let marketNative = null;
      if (px) {
        if (!["per_mg", "per_g"].includes(px.unit)) {
          throw new Error("METAL_VALUATION_UNIT_INVALID:" + h.instrument_id);
        }
        if (!["gross", "fine"].includes(px.purityBasis || "")) {
          throw new Error("METAL_VALUATION_PURITY_BASIS_REQUIRED:" + h.instrument_id);
        }
        const pricedQuantityMg = px.purityBasis === "fine" ? qtyMg.times(purity) : qtyMg;
        const pricePerMg = px.unit === "per_g" ? px.price.div(1000) : px.price;
        marketNative = pricedQuantityMg.times(pricePerMg);
      }
      return finalizeHolding({
        assetClass: "metals",
        instrumentId: h.instrument_id,
        quantity: qtyMg,
        cost,
        costCurrency: h.cost_currency,
        price: px,
        marketNative,
        extra: {
          holdingId: h.id,
          platformId: h.platform_id,
          purityCode: h.purity_code,
          purityRatio: purity.toFixed(),
          fineWeightMg: qtyMg.times(purity).toFixed(),
          quantityUnit: "mg",
        },
      });
    });

  const all = [...crypto, ...stocks, ...funds, ...metals];
  const totalCost = all.reduce((s, h) => s.plus(reportCurrency ? toReport(h.cost, h.costCurrency) : toDecimal(h.cost)), toDecimal("0"));
  const totalMarketValue = all.reduce((s, h) => h.marketValue == null ? s : s.plus(toDecimal(h.marketValue)), toDecimal("0"));
  const totalUnrealized = all.reduce((s, h) => h.unrealizedPnl == null ? s : s.plus(toDecimal(h.unrealizedPnl)), toDecimal("0"));

  return {
    crypto,
    stocks,
    funds,
    metals,
    totals: {
      reportCurrency: reportCurrency || null,
      valuedCount: all.filter((h) => h.marketValue != null).length,
      totalCost: totalCost.toFixed(),
      totalMarketValue: totalMarketValue.toFixed(),
      totalUnrealizedPnl: totalUnrealized.toFixed(),
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
