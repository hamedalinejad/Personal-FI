import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCommand,
  computeCommandHash,
  buildEconomicIdentity,
  runAtomicFinancialOperation,
} from "./operationEngine.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { closeAllDbs } from "../../persistence/port.js";

test("P0-01 computeCommandHash equals stable identity of normalizeCommand", () => {
  const cmd = {
    operationId: randomUUID(),
    type: "test.op",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    payload: { x: "1" },
    status: "draft",
    journalLines: [
      { accountId: "a1", side: "debit", amount: "10", currency: "IRR", amountInBase: "10", exchangeRateToBase: "1" },
      { accountId: "a2", side: "credit", amount: "10", currency: "IRR", amountInBase: "10", exchangeRateToBase: "1" },
    ],
    settlementDate: "2026-01-02",
    eventAt: "2026-01-01T00:00:00Z",
    provenance: { source: "test" },
  };
  const norm = normalizeCommand(cmd);
  const h1 = computeCommandHash(norm);
  const h2 = computeCommandHash({ ...norm, dataDir: "/tmp/should-not-matter" });
  assert.equal(h1, h2);
  assert.ok(h1.length >= 16);
  const id = buildEconomicIdentity(norm);
  assert.equal(id.settlementDate, "2026-01-02");
});
