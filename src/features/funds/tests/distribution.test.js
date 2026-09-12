import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { distributeFund } from "../public-api/index.js";
import { closeAllDbs } from "../../../core/persistence/port.js";

test("fund.distribution", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fd-"));
  const r = await distributeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "fund-d",
        amount: "200",
        currency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.equal(r.domainResult.amount, "200");
  closeAllDbs();
});
