/**
 * Full-edition composition surface.
 * UI and host apps import ONLY this registry or feature public-api barrels —
 * never feature internals, never journal writers.
 *
 * Architecture (LOCKED):
 * - Licensable vertical packages expose public-api: loan, crypto, funds, stocks, metals
 * - General modules (accounts, income, expense, cheque, tax, assets, budget, goals, bills)
 *   are host/core surfaces in Full edition — not separate edition packages in v1
 * - Standalone editions never require Accounts UI
 */
import * as loan from "../features/loan/public-api/index.js";
import * as crypto from "../features/crypto/public-api/index.js";
import * as funds from "../features/funds/public-api/index.js";
import * as stocks from "../features/stocks/public-api/index.js";
import * as metals from "../features/metals/public-api/index.js";

export const EDITIONS = Object.freeze({
  full: {
    id: "full",
    requiresAccountsUi: true,
    features: ["loan", "crypto", "funds", "stocks", "metals"],
    hostSurfaces: ["accounts", "income", "expense", "cheque", "tax", "assets", "budget", "goals", "bills"],
  },
  "loan-only": { id: "loan-only", requiresAccountsUi: false, features: ["loan"] },
  "crypto-only": { id: "crypto-only", requiresAccountsUi: false, features: ["crypto"] },
  "funds-only": { id: "funds-only", requiresAccountsUi: false, features: ["funds"] },
  /** @deprecated use funds-only */
  "fund-only": { id: "funds-only", requiresAccountsUi: false, features: ["funds"] },
  "stocks-only": { id: "stocks-only", requiresAccountsUi: false, features: ["stocks"] },
  "metals-only": { id: "metals-only", requiresAccountsUi: false, features: ["metals"] },
});

export const publicApis = Object.freeze({
  loan,
  crypto,
  funds,
  stocks,
  metals,
});

export function listEditionCapabilities() {
  return {
    loan: loan.capabilities(),
    crypto: crypto.capabilities(),
    funds: funds.capabilities(),
    stocks: stocks.capabilities(),
    metals: metals.capabilities(),
  };
}

export function getEdition(editionId = "full") {
  const e = EDITIONS[editionId];
  if (!e) throw new Error(`UNKNOWN_EDITION:${editionId}`);
  return e;
}

export function apisForEdition(editionId = "full") {
  const e = getEdition(editionId);
  const out = {};
  for (const name of e.features) {
    if (publicApis[name]) out[name] = publicApis[name];
  }
  return out;
}
