/**
 * Browser FinancialHost — single entry for commands and queries.
 * License gate at execute boundary.
 * Response shape §25: { ok, data, invalidated } | { ok: false, code, message }
 */

import { isQueryId } from "../../application/queryCatalog.js";
import { assertCommandAllowed, getRuntimeCapabilities } from "../../core/license/capabilityGate.js";
import {
  getMeta,
  queryAll,
  queryOne,
  withImmediateTransaction,
  durablePersist,
} from "../../core/persistence/browser/browserSqlAdapter.js";
import { toDecimal, canonicalDecimalString } from "../../core/money/canonicalDecimal.js";
import { ok, fail, normalizeResult } from "../../application/contracts/apiEnvelope.js";

/**
 * @param {{ db: any, edition?: string, commandHandlers?: Record<string, Function>, queryHandlers?: Record<string, Function> }} opts
 */
export function createFinancialHost(opts) {
  const { db, edition = "standalone", commandHandlers = {}, queryHandlers = {} } = opts;
  if (!db) throw new Error("HOST_DB_REQUIRED");

  const bookId = getMeta(db, "book_id");
  const baseCurrency = getMeta(db, "book_base_currency") || "IRR";

  async function execute(commandId, payload = {}, meta = {}) {
    if (typeof commandId !== "string" || !commandId) {
      return fail("INVALID_COMMAND_ID");
    }
    try {
      assertCommandAllowed(edition, commandId);
    } catch (e) {
      return fail(e.code || "LICENSE_REQUIRED", e.message);
    }
    const handler = commandHandlers[commandId];
    if (!handler) {
      return fail("COMMAND_NOT_WIRED", `No handler for ${commandId}`);
    }
    try {
      const result = await handler({ db, payload, meta, bookId, baseCurrency, host });
      const normalized = normalizeResult(result, meta);
      if (normalized.ok && meta.skipPersist !== true) {
        await durablePersist(db);
      }
      return normalized;
    } catch (err) {
      return fail(err.code || "COMMAND_FAILED", err.message || String(err));
    }
  }

  async function query(queryId, params = {}) {
    if (!isQueryId(queryId)) {
      return fail("UNKNOWN_QUERY_ID", `Query id not in QUERY_CATALOG: ${queryId}`);
    }
    const handler = queryHandlers[queryId];
    if (!handler) {
      if (queryId === "meta.book") {
        return ok({
          id: bookId,
          bookId,
          name: getMeta(db, "book_name") || "Personal Book",
          baseCurrency,
          createdAt: getMeta(db, "book_created_at"),
          schemaVersion: getMeta(db, "schemaVersion"),
        });
      }
      if (queryId === "meta.license") {
        return ok(getRuntimeCapabilities(edition));
      }
      return fail("QUERY_NOT_WIRED", `No handler for ${queryId}`);
    }
    try {
      const data = await handler({ db, params, bookId, baseCurrency, host });
      return ok(data);
    } catch (err) {
      return fail(err.code || "QUERY_FAILED", err.message || String(err));
    }
  }

  const host = {
    execute,
    query,
    getBookId: () => bookId,
    getBaseCurrency: () => baseCurrency,
    getEdition: () => edition,
    getDb: () => db,
    queryAll: (sql, p) => queryAll(db, sql, p),
    queryOne: (sql, p) => queryOne(db, sql, p),
    getMeta: (k) => getMeta(db, k),
    withImmediateTransaction: (fn) => withImmediateTransaction(db, fn),
    canonicalDecimal: canonicalDecimalString,
    toDecimal,
  };

  return host;
}

export { ok, fail, normalizeResult };
