/**
 * Phase 8 — Rebuild projection from SQLite posted operations.
 */
import { openDb } from "../persistence/port.js";
import { rebuildProjection } from "./rebuildProjection.js";

export function loadPostedOperations(dataDir, { asOf = null } = {}) {
  const db = openDb(dataDir);
  let sql = `SELECT id, operation_type as type, status, business_date as businessDate,
                     created_at as createdAt, result_json, command_hash as commandHash
              FROM fin_operations WHERE status = 'posted'`;
  const params = [];
  if (asOf) {
    sql += ` AND business_date <= ?`;
    params.push(asOf);
  }
  sql += ` ORDER BY business_date ASC, created_at ASC, id ASC`;
  const rows = db.prepare(sql).all(...params);
  return rows.map((r) => {
    let domainResult = null;
    try {
      const result = r.result_json ? JSON.parse(r.result_json) : null;
      domainResult = result?.domainResult || result?.domain || null;
    } catch {
      domainResult = null;
    }
    return {
      operationId: r.id,
      id: r.id,
      type: r.type,
      status: r.status,
      businessDate: r.businessDate,
      createdAt: r.createdAt,
      commandHash: r.commandHash,
      domainResult,
    };
  });
}

export function rebuildFromDatabase(dataDir, { asOf, engineVersions = {} } = {}) {
  if (!asOf) throw new Error("REBUILD_ASOF_REQUIRED");
  const operations = loadPostedOperations(dataDir, { asOf });
  return rebuildProjection({
    asOf,
    engineVersions,
    sourceLedger: { operations },
  });
}
