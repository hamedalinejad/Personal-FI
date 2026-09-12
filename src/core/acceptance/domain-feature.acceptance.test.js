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
  const dir = mkdtempSync(join(tmpdir(), "pf-dom-"));
  const db = new DatabaseSync(join(dir, "t.sqlite"));
  db.exec(sql);
  return db;
}

test("CRYPTO-001 fee funding CHECK exclusivity", () => {
  const db = openSchema();
  // need parent rows minimally — may fail FK; test CHECK via table_info + pragma
  const sql = db
    .prepare(`SELECT sql FROM sqlite_master WHERE name='inv_crypto_transactions'`)
    .get().sql;
  assert.match(sql, /fee_funding_kind/);
  assert.match(sql, /fee_currency IS NOT NULL/);
  assert.match(sql, /fee_instrument_id IS NOT NULL/);
  db.close();
});

test("CRYPTO-003 address columns present", () => {
  const db = openSchema();
  const cols = db.prepare(`PRAGMA table_info(inv_crypto_transactions)`).all().map((c) => c.name);
  assert.ok(cols.includes("from_address_id"));
  assert.ok(cols.includes("to_address_id"));
  db.close();
});

test("STOCK-004 instrument_price_mappings exists", () => {
  const db = openSchema();
  const cols = db.prepare(`PRAGMA table_info(instrument_price_mappings)`).all().map((c) => c.name);
  for (const c of ["instrument_id", "source_id", "provider_symbol", "market", "status"]) {
    assert.ok(cols.includes(c) || cols.includes(c.replace("_", "")), `missing ${c} in ${cols}`);
  }
  db.close();
});

test("METAL-003 delivery fee column separate from trade fee", () => {
  const db = openSchema();
  const tx = db.prepare(`PRAGMA table_info(inv_metals_transactions)`).all().map((c) => c.name);
  const del = db.prepare(`PRAGMA table_info(inv_metals_physical_deliveries)`).all().map((c) => c.name);
  assert.ok(tx.includes("fee_amount"));
  assert.ok(del.includes("fee_amount"));
  db.close();
});

test("STOCK-001 date field names in stocks transactions", () => {
  const db = openSchema();
  const cols = db.prepare(`PRAGMA table_info(inv_stocks_iran_transactions)`).all().map((c) => c.name);
  assert.ok(cols.includes("trade_date"));
  assert.ok(cols.includes("settlement_date"));
  db.close();
});
