import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { normalizeCommand, computeCommandHash } from "../domain/operation/operationEngine.js";
import { intervalsOverlap, assertNoActiveMappingOverlap } from "../domain/price/mappingConflict.js";
import { archiveAccount } from "../accounting/chartOfAccounts.js";

function openSchema() {
  const sql = readFileSync("docs/core/db/schema.sql", "utf8")
    .split("\n")
    .map((l) => (l.includes("--") ? l.slice(0, l.indexOf("--")) : l))
    .join("\n");
  const db = new DatabaseSync(join(mkdtempSync(join(tmpdir(), "pf-b21-")), "t.sqlite"));
  db.exec(sql);
  return db;
}

test("BUG-CUR-023 no legacy account_kind aliases", () => {
  const db = openSchema();
  const sql = db.prepare(`SELECT sql FROM sqlite_master WHERE name='acc_accounts'`).get().sql;
  assert.ok(!sql.includes("'bank'") || sql.includes("bank_account"));
  assert.ok(sql.includes("bank_account"));
  assert.ok(!/',investment'/.test(sql) && !sql.includes("'investment'"));
  db.close();
});

test("BUG-CUR-029 client hash is diagnostic only; canonical always computed", () => {
  const n = normalizeCommand({
    operationId: "x",
    status: "posted",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    commandHash: "deadbeef",
    journalLines: [
      { accountId: "a", side: "debit", amount: "1", currency: "IRR", amountInBase: "1" },
      { accountId: "b", side: "credit", amount: "1", currency: "IRR", amountInBase: "1" },
    ],
  });
  assert.equal(n.clientCommandHash, "deadbeef");
  const h = computeCommandHash(n);
  assert.notEqual(h, "deadbeef");
  assert.equal(h.length, 64);
});

test("BUG-CUR-024 overlap detection", () => {
  assert.ok(intervalsOverlap("2026-01-01", "2026-06-01", "2026-05-01", "2026-12-01"));
  assert.ok(!intervalsOverlap("2026-01-01", "2026-06-01", "2026-06-01", "2026-12-01"));
  assert.throws(
    () =>
      assertNoActiveMappingOverlap(
        [{ instrument_id: "i", source_id: "s", provider_symbol: "X", valid_from: "2026-01-01", valid_to: null, status: "active" }],
        { instrumentId: "i", sourceId: "s", providerSymbol: "X", validFrom: "2026-03-01", validTo: null },
      ),
    /PRICE_MAPPING_OVERLAP/,
  );
});

test("BUG-CUR-021 journal lines have no operation_id column", () => {
  const db = openSchema();
  const cols = db.prepare(`PRAGMA table_info(fin_journal_lines)`).all().map((c) => c.name);
  assert.ok(!cols.includes("operation_id"));
  db.close();
});
