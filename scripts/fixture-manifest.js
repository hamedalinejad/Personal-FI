import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const dirs = ["fixtures", "docs/core/fixtures"];
const files = [];
for (const d of dirs) {
  try {
    for (const f of readdirSync(d)) {
      if (!f.endsWith(".json") && !f.endsWith(".md")) continue;
      const p = join(d, f);
      const body = readFileSync(p);
      const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
      files.push({ path: p, hash });
    }
  } catch {
    /* missing dir */
  }
}
files.sort((a, b) => a.path.localeCompare(b.path));
const manifest = { version: 1, files };
writeFileSync("docs/core/registry/fixture-manifest.json", JSON.stringify(manifest, null, 2));
console.log("fixture-manifest:", files.length, "files");
