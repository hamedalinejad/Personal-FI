import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb, closeAllDbs } from "../../persistence/worker.js";
import { resolveStoredRate } from "./resolveStoredRate.js";

test("FX resolver: fail closed without observation", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-fx-"));
  const db = openDb(dataDir);
  assert.throws(
    () => resolveStoredRate(db, { fromCurrency: "USD", toCurrency: "IRR", asOf: "2026-01-01" }),
    /FX_RATE_NOT_FOUND/,
  );
  closeAllDbs();
});

test("FX resolver: priority then as_of <= requested", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-fx2-"));
  const db = openDb(dataDir);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO cur_currencies (code, name, minor_units, is_active) VALUES ('USD','US Dollar',2,1),('IRR','Rial',0,1)`,
  ).run();
  db.prepare(
    `INSERT INTO cur_exchange_rates (id, from_currency, to_currency, rate, as_of, source, source_priority, is_manual, is_stale, created_at)
     VALUES ('r1','USD','IRR','400000','2026-01-01T00:00:00.000Z','manual',50,1,0,?),
            ('r2','USD','IRR','420000','2026-01-02T00:00:00.000Z','manual',50,1,0,?),
            ('r3','USD','IRR','999999','2026-01-02T00:00:00.000Z','vendor',10,0,0,?)`,
  ).run(now, now, now);
  // asOf Jan 2: prefer priority 10 vendor over same-day manual
  const r = resolveStoredRate(db, { fromCurrency: "USD", toCurrency: "IRR", asOf: "2026-01-02T12:00:00.000Z" });
  assert.equal(r.rate, "999999");
  assert.equal(r.source, "vendor");
  // asOf Jan 1: only r1
  const r1 = resolveStoredRate(db, { fromCurrency: "USD", toCurrency: "IRR", asOf: "2026-01-01T12:00:00.000Z" });
  assert.equal(r1.rate, "400000");
  closeAllDbs();
});
