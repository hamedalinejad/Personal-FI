import test from "node:test";
import assert from "node:assert/strict";
import { sortEvents } from "./ordering.js";

test("sort by date then createdAt then id", () => {
  const sorted = sortEvents([
    { businessDate: "2026-01-02", createdAt: "T2", id: "b" },
    { businessDate: "2026-01-01", createdAt: "T2", id: "a" },
    { businessDate: "2026-01-01", createdAt: "T1", id: "c" },
  ]);
  assert.deepEqual(
    sorted.map((e) => e.id),
    ["c", "a", "b"],
  );
});
