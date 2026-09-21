/**
 * FinancialOperationRunner — DB-backed atomic path (browser + Node sql.js/sqlite).
 * Idempotency SoT: fin_operations + optional payload table, NOT filesystem JSON.
 */

import { computeCommandHash } from "./commandHash.js";
import { assertJournalBalanced, persistJournal } from "../../accounting/journal.js";
import { acquireWriteLock } from "../../persistence/browser/singleWriter.js";

function newId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadOperation(db, operationId) {
  const stmt = db.prepare("SELECT * FROM fin_operations WHERE id = ?");
  stmt.bind([operationId]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

/**
 * @param {object} opts
 * @param {any} opts.db
 * @param {string} opts.commandId
 * @param {object} opts.payload
 * @param {string} opts.operationId
 * @param {string} opts.businessDate
 * @param {string} opts.baseCurrency
 * @param {string} [opts.sourceFeature]
 * @param {() => Promise<{ journal: { lines: object[], memo?: string }, domainWrite?: (db:any)=>void, resultData?: object }>} opts.apply
 * @param {() => Promise<void>} [opts.durablePersist] — after SQL commit, persist bytes
 */
export async function runAtomicFinancialOperation({
  db,
  commandId,
  payload,
  operationId,
  businessDate,
  baseCurrency,
  sourceFeature = "core",
  apply,
  durablePersist = null,
}) {
  if (!db) throw Object.assign(new Error("DB_REQUIRED"), { code: "DB_REQUIRED" });
  if (!operationId || typeof operationId !== "string") {
    throw Object.assign(new Error("OP_OPERATION_ID_REQUIRED"), { code: "OP_OPERATION_ID_REQUIRED" });
  }
  if (!commandId) throw Object.assign(new Error("OP_COMMAND_ID_REQUIRED"), { code: "OP_COMMAND_ID_REQUIRED" });
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("OP_BUSINESS_DATE_REQUIRED"), { code: "OP_BUSINESS_DATE_REQUIRED" });
  }
  if (!baseCurrency || !/^[A-Z]{3}$/.test(baseCurrency)) {
    throw Object.assign(new Error("OP_BASE_CURRENCY_REQUIRED"), { code: "OP_BASE_CURRENCY_REQUIRED" });
  }
  if (typeof apply !== "function") {
    throw Object.assign(new Error("OP_APPLY_REQUIRED"), { code: "OP_APPLY_REQUIRED" });
  }

  const commandHash = await computeCommandHash({ commandId, payload });
  const existing = loadOperation(db, operationId);
  if (existing) {
    if (existing.command_hash && existing.command_hash !== commandHash) {
      throw Object.assign(new Error("OP_IDEMPOTENCY_CONFLICT"), {
        code: "OP_IDEMPOTENCY_CONFLICT",
      });
    }
    return {
      success: true,
      idempotentReplay: true,
      data: { operationId, commandHash, status: existing.status },
    };
  }

  const built = await apply();
  if (!built?.journal?.lines) {
    throw Object.assign(new Error("OP_JOURNAL_REQUIRED"), { code: "OP_JOURNAL_REQUIRED" });
  }
  assertJournalBalanced(built.journal.lines);

  let release = async () => {};
  try {
    if (typeof indexedDB !== "undefined") {
      release = await acquireWriteLock();
    }
  } catch {
    /* Node tests without locks */
  }

  const now = new Date().toISOString();
  try {
    db.run("BEGIN IMMEDIATE");
    try {
      db.run(
        `INSERT INTO fin_operations (
          id, command_hash, operation_type, status, durability_state,
          business_date, base_currency, source, created_at, posted_at
        ) VALUES (?, ?, ?, 'posted', 'sql_committed', ?, ?, ?, ?, ?)`,
        [operationId, commandHash, commandId, businessDate, baseCurrency, sourceFeature, now, now]
      );

      if (typeof built.domainWrite === "function") {
        built.domainWrite(db);
      }

      persistJournal(db, {
        operationId,
        businessDate,
        memo: built.journal.memo || null,
        lines: built.journal.lines,
        now,
      });

      db.run("COMMIT");
    } catch (e) {
      try {
        db.run("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw e;
    }

    if (typeof durablePersist === "function") {
      await durablePersist();
      try {
        db.run(`UPDATE fin_operations SET durability_state = 'persisted' WHERE id = ?`, [operationId]);
      } catch {
        /* optional column / best-effort */
      }
    }

    return {
      success: true,
      idempotentReplay: false,
      data: {
        operationId,
        commandHash,
        ...(built.resultData || {}),
      },
    };
  } finally {
    await release();
  }
}

export { computeCommandHash, newId };
