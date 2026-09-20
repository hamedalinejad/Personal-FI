/**
 * Dashboard / money totals — Mode A (REQ-P1-18).
 * Per-currency totals always.
 * netCash only when single currency OR reportCurrency+FX provided.
 * Never invent FX rates.
 */

import { toDecimal, canonicalDecimalString } from "../../core/money/canonicalDecimal.js";
import { queryPresentationBalance } from "../../core/accounting/reports/presentationBalance.js";
import { queryAll } from "../../core/persistence/browser/browserSqlAdapter.js";

/**
 * @param {any} db
 * @param {{ reportCurrency?: string|null, fxToReport?: Map<string,string> }} [opts]
 */
export function computeMoneyTotals(db, opts = {}) {
  const { reportCurrency = null, fxToReport = new Map() } = opts;

  const accounts = queryAll(
    db,
    `SELECT id, name, currency, account_kind FROM fin_accounts
     WHERE is_archived = 0 AND account_kind LIKE 'asset%'`
  );

  /** @type {Record<string, { currency: string, balance: string, accountCount: number }>} */
  const byCurrency = {};

  for (const acct of accounts) {
    const bal = queryPresentationBalance(db, acct.id, acct.account_kind);
    const ccy = acct.currency || "IRR";
    if (!byCurrency[ccy]) {
      byCurrency[ccy] = { currency: ccy, balance: "0", accountCount: 0 };
    }
    const sum = toDecimal(byCurrency[ccy].balance).plus(toDecimal(bal));
    byCurrency[ccy].balance = canonicalDecimalString(sum.toFixed());
    byCurrency[ccy].accountCount += 1;
  }

  const currencies = Object.keys(byCurrency);
  let netCash = null;
  let netCashState = "unavailable";

  if (currencies.length === 0) {
    netCash = "0";
    netCashState = "ready";
  } else if (currencies.length === 1) {
    netCash = byCurrency[currencies[0]].balance;
    netCashState = "ready";
  } else if (reportCurrency) {
    let total = toDecimal("0");
    let missingFx = false;
    for (const ccy of currencies) {
      if (ccy === reportCurrency) {
        total = total.plus(toDecimal(byCurrency[ccy].balance));
      } else {
        const fx = fxToReport.get(ccy);
        if (fx == null || fx === "") {
          missingFx = true;
          break;
        }
        total = total.plus(toDecimal(byCurrency[ccy].balance).times(toDecimal(fx)));
      }
    }
    if (missingFx) {
      netCash = null;
      netCashState = "missing_fx";
    } else {
      netCash = canonicalDecimalString(total.toFixed());
      netCashState = "ready";
    }
  } else {
    netCash = null;
    netCashState = "mixed_currency_needs_report_currency";
  }

  return {
    byCurrency: Object.values(byCurrency),
    netCash,
    netCashState,
    reportCurrency,
    currencies,
  };
}
