import test from "node:test";
import assert from "node:assert/strict";
import {
  acquireWriter,
  releaseWriter,
  tryWrite,
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
