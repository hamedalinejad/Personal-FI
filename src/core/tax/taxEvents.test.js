import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { recordTaxEvent, listTaxEvents } from "./taxEvents.js";
import { closeAllDbs, openDb } from "../persistence/port.js";

test("tax events append-only", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-tax-"));
  openDb(dataDir);
  const op = randomUUID();
  // need fin_operations row for FK
  const db = openDb(dataDir);
  db.prepare(
    `INSERT INTO fin_operations (id, operation_type, status, business_date, base_currency, created_at, command_hash)
     VALUES (?, 'tax.test', 'posted', '2026-01-01', 'IRR', ?, 'hash')`,
  ).run(op, new Date().toISOString());
  const r = recordTaxEvent(dataDir, {
    operationId: op,
    taxKind: "withholding",
    taxAmount: "50",
    currency: "IRR",
    businessDate: "2026-01-01",
    policyVersion: "IR-WH-v1",
  });
  assert.equal(r.persisted, true);
  const list = listTaxEvents(dataDir, { operationId: op });
  assert.equal(list.length, 1);
  closeAllDbs();
});
