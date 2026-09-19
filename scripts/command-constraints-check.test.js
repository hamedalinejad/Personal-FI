import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs";

const CAT = "docs/core/registry/command-catalog.json";
const BAK = "docs/core/registry/command-catalog.json.bak-cstr";

function run() {
  return spawnSync("node", ["scripts/command-constraints-check.js"], { encoding: "utf8" });
}

function mutate(fn) {
  copyFileSync(CAT, BAK);
  try {
    const cat = JSON.parse(readFileSync(CAT, "utf8"));
    fn(cat);
    writeFileSync(CAT, JSON.stringify(cat, null, 2) + "\n");
    return run();
  } finally {
    copyFileSync(BAK, CAT);
    unlinkSync(BAK);
  }
}

test("constraints PASS on current catalog", () => {
  assert.equal(run().status, 0);
});

test("FAIL missing field reference in constraint", () => {
  const r = mutate((cat) => {
    const c = cat.commands["loan.create"];
    c.constraints.push({
      id: "ghost_field",
      type: "enum",
      field: "notARealField",
      values: ["x"],
      error: "X",
    });
    c.card.constraints = c.constraints;
  });
  assert.notEqual(r.status, 0);
});

test("FAIL requiredness mismatch", () => {
  const r = mutate((cat) => {
    const c = cat.commands["loan.create"];
    const cons = c.constraints.find((x) => x.id === "loan_method");
    cons.required = true;
    const rf = c.card.requestFields.find((f) => f.name === "method");
    rf.required = false;
  });
  assert.notEqual(r.status, 0);
});
