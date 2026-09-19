/**
 * P0-07 — field-preservation gate must fail on intentional defects.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MATRIX = join(ROOT, "docs/core/registry/field-preservation-matrix.json");
const BACKUP = join(ROOT, "docs/core/registry/field-preservation-matrix.json.bak-gate-test");

function runGate() {
  return spawnSync("node", ["scripts/field-preservation-check.js"], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

function withMutatedMatrix(mutate, fn) {
  copyFileSync(MATRIX, BACKUP);
  try {
    const m = JSON.parse(readFileSync(MATRIX, "utf8"));
    mutate(m);
    writeFileSync(MATRIX, JSON.stringify(m, null, 2) + "\n");
    return fn();
  } finally {
    copyFileSync(BACKUP, MATRIX);
    unlinkSync(BACKUP);
  }
}

test("gate PASS on current matrix", { concurrency: false }, () => {
  const r = runGate();
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

test("gate FAIL when stored != persistence.table.column", { concurrency: false }, () => {
  const r = withMutatedMatrix((m) => {
    const row = m.rows.find(
      (x) =>
        x.disposition === "PERSISTED" &&
        x.persistence?.table &&
        x.persistence?.column,
    );
    assert.ok(row, "need a PERSISTED row");
    row.stored = "totally.wrong_column";
  }, runGate);
  assert.notEqual(r.status, 0, "must fail on stored mismatch");
  assert.match(r.stderr + r.stdout, /stored|persistence|mismatch|FAIL/i);
});

test("gate FAIL when DEFERRED missing reason", { concurrency: false }, () => {
  const r = withMutatedMatrix((m) => {
    const row = m.rows.find((x) => String(x.disposition).toUpperCase() === "DEFERRED");
    if (!row) {
      m.rows.push({
        commandId: "test.deferred",
        field: "ghost",
        disposition: "DEFERRED",
        kind: "RAW",
      });
    } else {
      delete row.reason;
      delete row.note;
      delete row.owner;
    }
  }, runGate);
  assert.notEqual(r.status, 0);
});

test("gate FAIL when schema column missing for PERSISTED", { concurrency: false }, () => {
  const r = withMutatedMatrix((m) => {
    const row = m.rows.find((x) => x.disposition === "PERSISTED" && x.persistence);
    assert.ok(row);
    row.persistence = { table: "no_such_table_xyz", column: "nope", mode: "COLUMN" };
    row.stored = "no_such_table_xyz.nope";
  }, runGate);
  assert.notEqual(r.status, 0);
});
