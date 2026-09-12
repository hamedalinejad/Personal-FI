import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { stockDividend } from "../public-api/index.js";
import { closeAllDbs } from "../../../core/persistence/port.js";

test("stocks.dividend posts income journal", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-div-"));
  const r = await stockDividend(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "stk-div",
        symbol: "DIV",
        amount: "1000",
        withholdingTax: "50",
        currency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.equal(r.domainResult.net, "950");
  closeAllDbs();
});
