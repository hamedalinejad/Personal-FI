/**
 * Real browser production host (BUG-P0-06).
 * sql.js + IndexedDB + singleWriter — NOT Node harness.
 * No node:fs / node:path imports.
 */

import { openOrCreateBrowserDb, durablePersist, getMeta, queryAll } from "../../core/persistence/browser/browserSqlAdapter.js";
import { createFinancialHost } from "./financialHost.js";
import { commandHandlers, queryHandlers } from "../../application/publicApiRegistry.js";
import { valueHoldings } from "../../core/accounting/reports/investment.js";
import { restoreBackupPackage, createBackupPackage } from "../../core/recovery/backupPackage.js";

/**
 * @param {{ SQL: any, schemaSql: string, edition?: string, baseCurrency?: string }} opts
 */
export async function bootBrowserProductionHost(opts) {
  const { SQL, schemaSql, edition = "standalone", baseCurrency = "IRR" } = opts;
  if (!SQL || typeof SQL.Database !== "function") {
    throw new Error("SQLJS_RUNTIME_MISSING");
  }
  if (!schemaSql) throw new Error("SCHEMA_SQL_REQUIRED");

  const { db, created, bookId } = await openOrCreateBrowserDb({
    SQL,
    schemaSql,
    createIfMissing: true,
    baseCurrency,
  });

  // Extend query handlers with investments.holdings using valueHoldings
  const extendedQueries = {
    ...queryHandlers,
    "investments.holdings": async ({ db: d }) => {
      // Minimal holdings from crypto table if present
      let holdings = [];
      try {
        holdings = queryAll(
          d,
          `SELECT instrument_id as instrumentId, quantity, total_invested as costBasis, cost_currency as costCurrency
           FROM inv_crypto_holdings`
        ).map((h) => ({ ...h, assetClass: "crypto", symbol: h.instrumentId }));
      } catch {
        holdings = [];
      }
      const result = valueHoldings({
        holdings,
        prices: new Map(),
        reportCurrency: getMeta(d, "book_base_currency") || baseCurrency,
      });
      return {
        rows: result.rows,
        valuationState: result.state,
        state: result.state,
        totals: result.totals,
        reason: result.reason,
        meta: result.meta,
      };
    },
  };

  const host = createFinancialHost({
    db,
    edition,
    commandHandlers,
    queryHandlers: extendedQueries,
  });

  // Attach backup/restore on host (browser bytes contract — BUG-P0-07)
  host.backup = async (label) => {
    const pkg = await createBackupPackage(db, { label });
    return { success: true, data: pkg };
  };

  host.restore = async (pkg) => {
    const result = await restoreBackupPackage(pkg, { SQL, schemaSql });
    return result;
  };

  return {
    host,
    db,
    created,
    bookId,
    edition,
  };
}
