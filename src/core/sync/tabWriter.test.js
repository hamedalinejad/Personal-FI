import test from "node:test";
import assert from "node:assert/strict";
import {
  acquireWriter,
  releaseWriter,
  tryWrite,
  withBrowserLock,
  onWriterEvent,
  _resetWritersForTests,
} from "./tabWriter.js";

test("P1-OFFLINE-003 non-writer gets WRITER_REQUIRED", () => {
  _resetWritersForTests();
  acquireWriter("db1", "tab-A");
  assert.throws(() => acquireWriter("db1", "tab-B"), /WRITER_REQUIRED/);
  assert.throws(() => tryWrite("db1", "tab-B", () => 1), /WRITER_REQUIRED/);
  assert.equal(tryWrite("db1", "tab-A", () => 42), 42);
  releaseWriter("db1", "tab-A");
  acquireWriter("db1", "tab-B");
});

test("P1-OFFLINE-003 withBrowserLock serializes owners", async () => {
  _resetWritersForTests();
  const events = [];
  onWriterEvent((e) => events.push(e.type));
  await withBrowserLock("db2", "tab-1", async () => {
    assert.throws(() => acquireWriter("db2", "tab-2"), /WRITER_REQUIRED/);
  });
  await withBrowserLock("db2", "tab-2", async () => 1);
  assert.ok(events.includes("writer-acquired"));
  assert.ok(events.includes("writer-released"));
});
