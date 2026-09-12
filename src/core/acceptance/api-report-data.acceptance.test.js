import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";

function openSchema() {
  const sql = readFileSync("docs/core/db/schema.sql", "utf8")
    .split("\n")
    .map((l) => (l.includes("--") ? l.slice(0, l.indexOf("--")) : l))
    .join("\n");
  const db = new DatabaseSync(join(mkdtempSync(join(tmpdir(), "pf-ard-")), "t.sqlite"));
  db.exec(sql);
  return db;
}

test("DATA-001 docs_documents has relative_path/blob_id", () => {
  const db = openSchema();
  const cols = db.prepare(`PRAGMA table_info(docs_documents)`).all().map((c) => c.name);
  assert.ok(cols.includes("relative_path") || cols.includes("blob_id"));
  assert.ok(cols.includes("checksum"));
  db.close();
});

test("DATA-002 import_batches exists", () => {
  const db = openSchema();
  const row = db.prepare(`SELECT name FROM sqlite_master WHERE name='import_batches'`).get();
  assert.ok(row);
  db.close();
});

test("REPORT-002 rpt_ tables exist", () => {
  const db = openSchema();
  for (const n of ["rpt_presets", "rpt_net_worth_snapshots", "rpt_snapshots"]) {
    assert.ok(db.prepare(`SELECT name FROM sqlite_master WHERE name=?`).get(n), n);
  }
  db.close();
});

test("PRES-002 result_hash columns on fin_operations", () => {
  const db = openSchema();
  const cols = db.prepare(`PRAGMA table_info(fin_operations)`).all().map((c) => c.name);
  assert.ok(cols.includes("result_json"));
  assert.ok(cols.includes("result_schema_version"));
  assert.ok(cols.includes("result_hash"));
  db.close();
});

test("TAX-002 period bounds columns", () => {
  const db = openSchema();
  const cols = db.prepare(`PRAGMA table_info(tax_records)`).all().map((c) => c.name);
  assert.ok(cols.includes("calendar_system"));
  assert.ok(cols.includes("period_start"));
  assert.ok(cols.includes("period_end"));
  db.close();
});

test("API-001 envelope doc exists", () => {
  const t = readFileSync("docs/core/API-CANONICAL-ENVELOPE.md", "utf8");
  assert.match(t, /errors\[\]\.code/);
  assert.match(t, /api_version/);
});
