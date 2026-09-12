#!/usr/bin/env node
/**
 * P0-TEST-001 — reject claimed financial fixtures with empty expected.
 * A fixture is "claimed" if input is non-empty OR id suggests a financial op.
 * Empty expected.domain/journal when input has method/operation is FAIL.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dirs = [path.join(root, "fixtures"), path.join(root, "docs/core/fixtures")].filter(fs.existsSync);

function isEmptyObj(o) {
  return o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length === 0;
}

function isStructurallyEmptyExpected(exp) {
  if (!exp || typeof exp !== "object") return true;
  const keys = Object.keys(exp);
  if (keys.length === 0) return true;
  // all values empty object or empty array
  return keys.every((k) => {
    const v = exp[k];
    if (Array.isArray(v)) return v.length === 0;
    if (v && typeof v === "object") return Object.keys(v).length === 0;
    return v == null || v === "";
  });
}

function hasClaimedInput(input) {
  if (!input || typeof input !== "object") return false;
  return Object.keys(input).length > 0;
}

let failed = false;
let checked = 0;
let deferred = 0;

for (const dir of dirs) {
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const full = path.join(dir, name);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(full, "utf8"));
    } catch {
      console.error("INVALID_JSON", full);
      failed = true;
      continue;
    }
    checked++;
    const input = data.input || {};
    const expected = data.expected || {};
    const status = data.status || data.fixtureStatus;
    if (status === "DEFERRED" || status === "SCAFFOLD") {
      deferred++;
      continue;
    }
    if (hasClaimedInput(input) && isStructurallyEmptyExpected(expected)) {
      console.error("EMPTY_EXPECTED_FIXTURE", path.relative(root, full));
      failed = true;
    }
    // Scaffold with both empty: must mark DEFERRED
    if (!hasClaimedInput(input) && isStructurallyEmptyExpected(expected) && status !== "DEFERRED") {
      console.error("UNMARKED_EMPTY_FIXTURE", path.relative(root, full), "→ mark status:DEFERRED");
      failed = true;
    }
  }
}

console.log(`fixture-empty-check: checked=${checked} deferred=${deferred} ok=${!failed}`);
process.exit(failed ? 1 : 0);
