#!/usr/bin/env node
/** P1-TEST-003 — ban Number()/parseFloat() on money-like paths in domain/finance tests */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots = ["src/features", "src/core/domain", "src/core/money", "docs/core/fixtures"].map((r) =>
  path.join(root, r),
);
const re = /\b(Number|parseFloat)\s*\(\s*[a-zA-Z0-9_$.]*(amount|principal|interest|fee|payment|price|balance|invested|nav)/i;
const re2 = /\bNumber\s*\(\s*r\.(amount|principal|interest|fee|payment|price|balance)/;

let failed = false;
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (name.endsWith(".test.js") || name.endsWith(".js")) {
      const text = fs.readFileSync(full, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (re.test(line) || re2.test(line)) {
          // allow comments
          if (line.trim().startsWith("//")) return;
          console.error("NUMBER_MONEY", path.relative(root, full) + ":" + (i + 1), line.trim());
          failed = true;
        }
      });
    }
  }
}
for (const r of roots) walk(r);
console.log("lint-no-number-money:", failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
