import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { sumDecimalStrings } from "../money/canonicalDecimal.js";
import { wrapScheduleSnapshot, SCHEDULE_SNAPSHOT_SCHEMA_VERSION } from "../../features/loan/domain/scheduleSnapshot.js";
import { normalizeLoanRole } from "../../features/loan/domain/role.js";
import { BROWSER_ADAPTER_STATUS } from "../persistence/browser/sqlJsIndexedDbAdapter.js";

function openSchema() {
  const sql = readFileSync("docs/core/db/schema.sql", "utf8")
    .split("\n")
    .map((l) => (l.includes("--") ? l.slice(0, l.indexOf("--")) : l))
    .join("\n");
  const db = new DatabaseSync(join(mkdtempSync(join(tmpdir(), "pf-lao-")), "t.sqlite"));
  db.exec(sql);
  return db;
}

test("LOAN-001 role normalization", () => {
  assert.equal(normalizeLoanRole("lent"), "lender");
  assert.equal(normalizeLoanRole("borrowed"), "borrower");
  assert.throws(() => normalizeLoanRole("xyz"), /LOAN_ROLE/);
});

test("LOAN-001 role CHECK on schema", () => {
  const db = openSchema();
  const sql = db.prepare(`SELECT sql FROM sqlite_master WHERE name='ln_loans'`).get().sql;
  assert.match(sql, /borrower/);
  assert.match(sql, /lender/);
  db.close();
});

test("LOAN-002 snapshot envelope version", () => {
  const snap = wrapScheduleSnapshot({
    rows: [{ period: 1, payment: "100", principal: "100", interest: "0" }],
    engineVersion: "1.0.0-period_based-equal-principal",
    method: "declining_balance",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  assert.equal(snap.snapshotSchemaVersion, SCHEDULE_SNAPSHOT_SCHEMA_VERSION);
});

test("ACCOUNTING-003 sumDecimalStrings", () => {
  assert.equal(sumDecimalStrings(["10.5", "0.5"]), "11");
});

test("OFFLINE-003 null source unique index exists", () => {
  const db = openSchema();
  const idx = db.prepare(`SELECT name, sql FROM sqlite_master WHERE type='index' AND name LIKE '%price%'`).all();
  assert.ok(idx.some((i) => i.name.includes("null_source") || (i.sql && i.sql.includes("source_id IS NULL"))));
  db.close();
});

test("OFFLINE-004 wallet primary unique index", () => {
  const db = openSchema();
  const idx = db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%wallet%primary%'`).all();
  assert.ok(idx.length >= 1);
  db.close();
});

test("OFFLINE-001 browser adapter status exported", () => {
  assert.ok(typeof BROWSER_ADAPTER_STATUS === "string");
});
