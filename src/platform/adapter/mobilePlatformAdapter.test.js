import test from "node:test";
import assert from "node:assert/strict";
import {
  createNodeMobileHarness,
  assertAdapterSurface,
  emptyPocScorecard,
  MOBILE_ADAPTER_CAPABILITIES,
  MOBILE_WRAPPER_STATUS,
} from "./mobilePlatformAdapter.js";

test("Phase12 node harness satisfies adapter surface", async () => {
  const a = createNodeMobileHarness();
  assertAdapterSurface(a);
  const st = await a.measureStartup();
  assert.ok(typeof st.coldMs === "number");
  const db = await a.openSqlite();
  assert.equal(db.open, true);
  await a.writeFile("x.bin", new Uint8Array([1, 2]));
  const r = await a.readFile("x.bin");
  assert.deepEqual([...r], [1, 2]);
});

test("Phase12 POC scorecard covers all axes; wrapper not chosen yet", () => {
  assert.equal(MOBILE_WRAPPER_STATUS, "POC_PENDING");
  const sc = emptyPocScorecard();
  for (const k of MOBILE_ADAPTER_CAPABILITIES) {
    assert.ok(k in sc.capacitor);
    assert.ok(k in sc.tauri);
  }
  assert.equal(sc.decision, null);
});
