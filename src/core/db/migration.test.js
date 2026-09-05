import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runMigrations } from "./migration.js";

test("BUG-015 migrate chain", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-mig-"));
  const r = await runMigrations({
    dataDir,
    migrations: [
      { id: "m1", from: 0, to: 1, up: async () => {} },
      { id: "m2", from: 1, to: 2, up: async () => {} },
    ],
  });
  assert.equal(r.version, 2);
  assert.equal(r.applied.length, 2);
});
