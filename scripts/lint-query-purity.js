#!/usr/bin/env node
/** REQ-028 soft: fail if feature query modules contain mutating SQL keywords */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const features = path.join(root, "src/features");
const re = /\b(INSERT|UPDATE|DELETE|REPLACE)\s+INTO\b/i;
let failed = false;
if (fs.existsSync(features)) {
  for (const feat of fs.readdirSync(features)) {
    const qdir = path.join(features, feat, "queries");
    if (!fs.existsSync(qdir)) continue;
    for (const f of fs.readdirSync(qdir)) {
      if (!f.endsWith(".js")) continue;
      const full = path.join(qdir, f);
      const text = fs.readFileSync(full, "utf8");
      if (re.test(text)) {
        console.error("QUERY_MUTATION", path.relative(root, full));
        failed = true;
      }
    }
  }
}
console.log("lint-query-purity:", failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
