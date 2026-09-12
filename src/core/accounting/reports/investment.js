import { openDb } from "../../persistence/port.js";
import { toDecimal } from "../../money/canonicalDecimal.js";

/**
 * Holdings + cost basis snapshot (Model A cost pool).
 * Unrealized requires valuation context (optional prices map).
 */
export function investmentHoldings(dataDir, { prices = {}, valuationContext = null } = {}) {
  // prices[instrumentId] must be { price, currency, asOf, source?, isStale? } or scalar only for same-currency provisional
  if (valuationContext == null && Object.keys(prices).length) {
    // allow but mark degraded
  }

  const db = openDb(dataDir);
  const crypto = db.prepare(`SELECT * FROM inv_crypto_holdings`).all();
  const stocks = db.prepare(`SELECT * FROM inv_stocks_iran_holdings`).all();
  const funds = db.prepare(`SELECT * FROM inv_fif_holdings`).all();
  const metals = db.prepare(`SELECT * FROM inv_metals_holdings`).all();

  function row(assetClass, h, qtyField, costField) {
    const qty = toDecimal(h[qtyField] || "0");
    const cost = toDecimal(h[costField] || "0");
    const avg = qty.isZero() ? toDecimal("0") : cost.div(qty);
    const px = prices[h.instrument_id];
    let market = null;
    let unrealized = null;
    let valuationMeta = null;
    if (px != null) {
      market = qty.times(toDecimal(px));
      unrealized = market.minus(cost);
    }
    return {
      assetClass,
      instrumentId: h.instrument_id,
      quantity: qty.toFixed(),
      totalInvested: cost.toFixed(),
      costCurrency: h.cost_currency,
      averageCost: avg.toFixed(),
      marketValue: market ? market.toFixed() : null,
      unrealizedPnl: unrealized ? unrealized.toFixed() : null,
      valuationContext: valuationContext || { degraded: true, note: "scalar price without full context" },
      valuationPrice: px != null ? String(px) : null,
    };
  }

  return {
    crypto: crypto.map((h) => row("crypto", h, "quantity", "total_invested")),
    stocks: stocks.map((h) => row("stocks", h, "quantity", "total_invested")),
    funds: funds.map((h) => row("funds", h, "quantity", "total_invested")),
    metals: metals.map((h) => row("metals", h, "quantity_mg", "total_invested")),
  };
}

export function realizedPnlFromJournal(dataDir, { fromDate = null, toDate = null } = {}) {
  const db = openDb(dataDir);
  let sql = `
    SELECT jl.account_id, jl.side, jl.amount, jl.amount_in_base, je.business_date
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
