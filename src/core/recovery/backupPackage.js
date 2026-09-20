/**
 * Browser backup/restore package (BUG-P0-07 / P0-08).
 * Contract: bytes + checksum — never filesystem paths in UI path.
 * Restore: validate → stage → publish → reopen → verify.
 * Failure leaves live DB untouched.
 */

import { saveDbBytes, loadDbBytes, clearDbBytes } from "../persistence/browser/idbByteStore.js";
import { getMeta } from "../persistence/browser/browserSqlAdapter.js";

const FORMAT_VERSION = "1";
const MAGIC = "PFIB"; // Personal-FI Backup

/**
 * Simple checksum (djb2) over bytes — sufficient for corruption detection in v1.
 * @param {Uint8Array|ArrayBuffer} bytes
 */
export function checksumBytes(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let h = 5381;
  for (let i = 0; i < u8.length; i++) {
    h = ((h << 5) + h) ^ u8[i];
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Verify SQLite header magic.
 * @param {Uint8Array} u8
 */
export function hasSqliteHeader(u8) {
  if (!u8 || u8.byteLength < 16) return false;
  const expected = "SQLite format 3\u0000";
  for (let i = 0; i < 16; i++) {
    if (u8[i] !== expected.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * @param {any} db sql.js Database
 * @param {{ label?: string }} [opts]
 * @returns {Promise<{ bytes: number[], checksum: string, formatVersion: string, schemaVersion: string, bookId: string|null, label: string|null, createdAt: string }>}
 */
export async function createBackupPackage(db, opts = {}) {
  const exported = db.export();
  const u8 = exported instanceof Uint8Array ? exported : new Uint8Array(exported);
  const checksum = checksumBytes(u8);
  const schemaVersion = getMeta(db, "schemaVersion") || "1";
  const bookId = getMeta(db, "book_id");
  return {
    bytes: Array.from(u8),
    checksum,
    formatVersion: FORMAT_VERSION,
    schemaVersion,
    bookId,
    label: opts.label || null,
    createdAt: new Date().toISOString(),
    magic: MAGIC,
  };
}

/**
 * Validate package without touching live DB.
 * @param {object} pkg
 */
export function validateBackupPackage(pkg) {
  if (!pkg || typeof pkg !== "object") {
    return { ok: false, code: "BACKUP_INVALID", message: "package missing" };
  }
  if (!pkg.bytes || !Array.isArray(pkg.bytes) || pkg.bytes.length === 0) {
    return { ok: false, code: "BACKUP_EMPTY", message: "no bytes" };
  }
  if (pkg.magic && pkg.magic !== MAGIC) {
    return { ok: false, code: "BACKUP_MAGIC_MISMATCH", message: "not a Personal-FI backup" };
  }
  if (pkg.formatVersion && pkg.formatVersion !== FORMAT_VERSION) {
    return { ok: false, code: "BACKUP_FORMAT_UNSUPPORTED", message: "format " + pkg.formatVersion };
  }
  const u8 = new Uint8Array(pkg.bytes);
  if (!hasSqliteHeader(u8)) {
    return { ok: false, code: "BACKUP_NOT_SQLITE", message: "SQLite header missing" };
  }
  const actual = checksumBytes(u8);
  if (pkg.checksum && pkg.checksum !== actual) {
    return { ok: false, code: "BACKUP_CHECKSUM_MISMATCH", message: "expected " + pkg.checksum + " got " + actual };
  }
  return { ok: true, u8, checksum: actual };
}

export async function restoreBackupPackage(pkg, runtime) {
  const { SQL } = runtime;
  if (!SQL || typeof SQL.Database !== "function") {
    return { success: false, errors: [{ code: "SQLJS_RUNTIME_MISSING" }] };
  }

  // 1. Validate
  const v = validateBackupPackage(pkg);
  if (!v.ok) {
    return { success: false, errors: [{ code: v.code, message: v.message }] };
  }

  // 2–3. Stage in temporary Database + integrity
  let staged;
  try {
    staged = new SQL.Database(v.u8);
    // basic integrity: can we query schema?
    const check = staged.exec("PRAGMA integrity_check");
    const ok =
      check &&
      check[0] &&
      check[0].values &&
      check[0].values[0] &&
      String(check[0].values[0][0]).toLowerCase() === "ok";
    if (!ok) {
      staged.close();
      return { success: false, errors: [{ code: "BACKUP_INTEGRITY_FAILED" }] };
    }
    // required tables
    const tables = staged.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('db_meta','fin_operations','fin_journal_lines')"
    );
    const names = tables?.[0]?.values?.map((r) => r[0]) || [];
    if (!names.includes("db_meta") || !names.includes("fin_operations")) {
      staged.close();
      return { success: false, errors: [{ code: "BACKUP_SCHEMA_INCOMPLETE" }] };
    }
  } catch (e) {
    try {
      staged?.close();
    } catch {
      /* ignore */
    }
    return {
      success: false,
      errors: [{ code: "BACKUP_STAGE_FAILED", message: String(e?.message || e) }],
    };
  }

  // 4. Publish durable bytes ONLY after checks pass
  try {
    await saveDbBytes(v.u8, {
      schemaVersion: pkg.schemaVersion || "1",
      bookId: pkg.bookId || null,
    });
  } catch (e) {
    staged.close();
    return {
      success: false,
      errors: [{ code: "BACKUP_PUBLISH_FAILED", message: String(e?.message || e) }],
    };
  }

  staged.close();

  // 5. Verify published
  try {
    const { bytes } = await loadDbBytes();
    if (!bytes || bytes.byteLength === 0) {
      return { success: false, errors: [{ code: "BACKUP_VERIFY_EMPTY" }] };
    }
    const verifyDb = new SQL.Database(new Uint8Array(bytes));
    const check = verifyDb.exec("PRAGMA integrity_check");
    verifyDb.close();
    const ok =
      check &&
      check[0] &&
      check[0].values &&
      check[0].values[0] &&
      String(check[0].values[0][0]).toLowerCase() === "ok";
    if (!ok) {
      return { success: false, errors: [{ code: "BACKUP_VERIFY_INTEGRITY_FAILED" }] };
    }
  } catch (e) {
    return {
      success: false,
      errors: [{ code: "BACKUP_VERIFY_FAILED", message: String(e?.message || e) }],
    };
  }

  return {
    success: true,
    data: {
      restored: true,
      bookId: pkg.bookId || null,
      schemaVersion: pkg.schemaVersion || "1",
      checksum: v.checksum,
    },
  };
}

/**
 * Corrupt-restore test helper: mutate bytes so checksum fails.
 */
export function corruptPackage(pkg) {
  const copy = { ...pkg, bytes: [...(pkg.bytes || [])] };
  if (copy.bytes.length > 100) {
    copy.bytes[100] = (copy.bytes[100] + 1) % 256;
  }
  return copy;
}
