import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { closeAllDbs } from "../persistence/worker.js";
import { rebuildFromDatabase, loadPostedOperations } from "./fromSqlite.js";
import { createAccount } from "../../features/accounts/public-api/index.js";
import { createIncome } from "../../features/income/public-api/index.js";

test("Phase8 rebuild from SQLite is deterministic", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-rb-"));
  const a = await createAccount(
    {
      operationId: randomUUID(),
      payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
    },
    { dataDir },
  );
  await createIncome(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "50",
        currency: "IRR",
        businessDate: "2026-03-01",
      },
    },
    { dataDir },
  );
  const ops = loadPostedOperations(dataDir, { asOf: "2026-12-31" });
  assert.ok(ops.length >= 1);
  const a1 = rebuildFromDatabase(dataDir, { asOf: "2026-12-31", engineVersions: { core: "1" } });
  const a2 = rebuildFromDatabase(dataDir, { asOf: "2026-12-31", engineVersions: { core: "1" } });
  assert.equal(a1.contextHash, a2.contextHash);
  assert.equal(a1.projections.operationCount, a2.projections.operationCount);
  closeAllDbs();
});
