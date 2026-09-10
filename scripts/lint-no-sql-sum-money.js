#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(js|sql|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
}

const files = [...walk(join(root, "src")), ...walk(join(root, "scripts"))];
let failed = false;
const banned = [
  /SUM\s*\(\s*amount/i,
  /AVG\s*\(\s*amount/i,
  /CAST\s*\(\s*amount\s+AS\s+REAL\s*\)/i,
  /SUM\s*\(\s*total_invested/i,
];
for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const re of banned) {
    if (re.test(text)) {
      console.error("NO-SQL-SUM-MONEY:", f.slice(root.length + 1), re);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log("lint-no-sql-sum-money: OK");
