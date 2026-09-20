/**
 * Browser FinancialHost — single entry for commands and queries.
 * License gate at execute boundary.
 * Wave-1 / Wave-3.
 */

import { isQueryId } from "../../application/queryCatalog.js";
import { assertCommandAllowed, getRuntimeCapabilities } from "../../core/license/capabilityGate.js";
import { getMeta, queryAll, queryOne, withImmediateTransaction, durablePersist } from "../../core/persistence/browser/browserSqlAdapter.js";
import { toDecimal, canonicalDecimalString } from "../../core/money/canonicalDecimal.js";

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
      // Durable persist after successful mutation
      if (result && result.success !== false && meta.skipPersist !== true) {
        await durablePersist(db);
      }
      return normalizeResult(result, meta);
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
      // Built-in meta queries
      if (queryId === "meta.book") {
        return ok({
          bookId,
          baseCurrency,
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
    // helpers exposed for handlers
    queryAll: (sql, p) => queryAll(db, sql, p),
    queryOne: (sql, p) => queryOne(db, sql, p),
    getMeta: (k) => getMeta(db, k),
    withImmediateTransaction: (fn) => withImmediateTransaction(db, fn),
    canonicalDecimal: canonicalDecimalString,
    toDecimal,
  };

  return host;
}

function ok(data) {
  return {
    success: true,
    data: data ?? null,
    errors: [],
    meta: { api_version: "1", schema_version: "1" },
  };
}

function fail(code, message) {
  return {
    success: false,
    data: null,
    errors: [{ code, message: message || code }],
    meta: { api_version: "1", schema_version: "1" },
  };
}

function normalizeResult(result, meta) {
  if (result && typeof result.success === "boolean") {
    return {
      ...result,
      meta: {
        api_version: "1",
        schema_version: "1",
        request_id: meta.requestId || null,
        operation_id: result.data?.operationId || result.operationId || null,
        ...(result.meta || {}),
      },
    };
  }
  // legacy {ok, data, code} adapter
  if (result && typeof result.ok === "boolean") {
    if (result.ok) {
      return ok(result.data);
    }
    return fail(result.code || "COMMAND_FAILED", result.message);
  }
  return ok(result);
}
