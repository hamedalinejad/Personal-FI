/**
 * Canonical QUERY_CATALOG — exact membership is the only allowed query id set.
 * P1-21: host must use isQueryId from this catalog; no string-prefix heuristics.
 */

export const QUERY_CATALOG = Object.freeze({
  // Accounts / money
  "accounts.list": { description: "List non-archived accounts with presentation balance" },
  "accounts.get": { description: "Single account by id" },
  "accounts.options": { description: "Account select options for UI" },
  "money.totals": { description: "Cash totals by currency and base" },

  // Operations / transactions
  "operations.list": { description: "Paginated operations (keyset)" },
  "operations.get": { description: "Single operation + journal lines" },
  "operations.search": { description: "Search operations by text/date range" },

  // Loans
  "loans.list": { description: "List loans with status" },
  "loans.get": { description: "Loan detail + schedule snapshot" },
  "loans.statement": { description: "Loan statement" },

  // Investments (unified)
  "investments.holdings": { description: "Unified holdings across crypto/stocks/funds/metals" },
  "investments.realizedPnl": { description: "Realized P&L by role/metadata" },
  "investments.valuation": { description: "Valuation context with missing/stale flags" },

  // Reports
  "reports.trialBalance": { description: "Trial balance" },
  "reports.balanceSheet": { description: "Balance sheet" },
  "reports.incomeStatement": { description: "Income statement" },
  "reports.cashFlow": { description: "Cash flow" },
  "reports.generalLedger": { description: "General ledger" },
  "reports.netWorth": { description: "Net worth" },
  "reports.investmentHoldings": { description: "Investment holdings report" },

  // Cheques
  "cheques.list": { description: "Cheque list by state" },
  "cheques.get": { description: "Single cheque" },

  // Tax
  "tax.events": { description: "Tax events list" },

  // Planning (read-only; no journal leakage)
  "planning.budgets": { description: "Budgets overview" },
  "planning.goals": { description: "Goals progress" },
  "planning.bills": { description: "Bills / occurrences" },

  // Meta
  "meta.book": { description: "Book id + base currency + schema version" },
  "meta.license": { description: "Current edition + capabilities" },
});

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isQueryId(id) {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(QUERY_CATALOG, id);
}

/**
 * @returns {string[]}
 */
export function listQueryIds() {
  return Object.keys(QUERY_CATALOG);
}
