/**
 * Full-edition composition surface.
 * UI and host apps import ONLY this registry or feature public-api barrels —
 * never feature internals, never journal writers.
 *
 * Standalone: import one feature public-api + Core ports.
 * Full: import this registry (or multiple public-apis); shared journal truth.
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
    features: ["loan", "crypto", "funds", "stocks", "metals", "accounts"],
  },
  "loan-only": { id: "loan-only", requiresAccountsUi: false, features: ["loan"] },
  "crypto-only": { id: "crypto-only", requiresAccountsUi: false, features: ["crypto"] },
  "fund-only": { id: "fund-only", requiresAccountsUi: false, features: ["funds"] },
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

/** Capabilities snapshot for licensing / host boot */
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

/**
 * Resolve which public-api modules a host may call for an edition.
 * Full edition gets all; feature-only gets one package + shared Core underneath.
 */
export function apisForEdition(editionId = "full") {
  const e = getEdition(editionId);
  const out = {};
  for (const name of e.features) {
    if (publicApis[name]) out[name] = publicApis[name];
  }
  return out;
}
