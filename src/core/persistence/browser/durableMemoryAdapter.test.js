import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { isDurableAcked, BROWSER_ADAPTER_STATUS } from "./durableMemoryAdapter.js";
import { writeFileSync, mkdirSync } from "node:fs";

test("browser durable protocol marker", async () => {
  assert.equal(BROWSER_ADAPTER_STATUS, "DURABLE_MEMORY_PROTOCOL");
  const dataDir = await mkdtemp(join(tmpdir(), "pf-dur-"));
  const operationId = randomUUID();
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, `.durable-${operationId}.json`), "{}", "utf8");
  assert.equal(isDurableAcked(dataDir, operationId), true);
});
