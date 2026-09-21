import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { reportPack, coreReportPack } from "./reportPack.js";

test("application reportPack exports composition entry", () => {
  assert.equal(typeof reportPack, "function");
  assert.equal(typeof coreReportPack, "function");
});

test("Core reports index must not import features", () => {
  const text = readFileSync("src/core/accounting/reports/index.js", "utf8");
  assert.equal(/features\//.test(text), false);
});

test("dep invariant: no production core file imports features", () => {
  function walk(dir, acc = []) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, acc);
      else if (/\.js$/.test(name) && !/\.test\.js$/.test(name)) acc.push(p);
    }
    return acc;
  }
  const bad = [];
  for (const f of walk("src/core")) {
    const t = readFileSync(f, "utf8");
    if (/from\s+["'][^"']*features\//.test(t)) bad.push(f);
  }
  assert.deepEqual(bad, []);
});
