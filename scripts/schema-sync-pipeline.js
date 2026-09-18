#!/usr/bin/env node
/**
 * schema.sql → manifest → inventory must stay synchronized.
 * 1) Regenerate manifest hash from schema
 * 2) Verify checked-in manifest matches
 * 3) Verify field-inventory covers every CREATE column
 * 4) Emit (stdout only; no markdown artifact)
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "crypto";
import { execSync } from "child_process";

const root = process.cwd();
const schemaPath = join(root, "docs/core/db/schema.sql");
const manifestPath = join(root, "docs/core/db/schema.manifest.json");
const invPath = join(root, "docs/core/field-inventory.checklist.tsv");

if (!existsSync(schemaPath)) {
  console.error("MISSING schema.sql");
  process.exit(1);
}

// BUG-F15: gates must not mutate artifacts. Generate only when SCHEMA_SYNC_WRITE=1.
const writeMode = process.env.SCHEMA_SYNC_WRITE === "1";
try {
  if (writeMode) {
    execSync("node scripts/schema-manifest.js", { stdio: "inherit" });
  }
  execSync("node scripts/schema-manifest-check.js", { stdio: "inherit" });
  execSync("STRICT_INVENTORY=1 node scripts/field-inventory-verify.js", {
    stdio: "inherit",
  });
} catch {
  console.error("schema-sync-pipeline FAILED (manifest/inventory)");
  process.exit(1);
}

const sql = readFileSync(schemaPath, "utf8");
const prepared = sql
  .split("\n")
  .map((l) => (l.includes("--") ? l.slice(0, l.indexOf("--")) : l))
  .join("\n");

const dir = mkdtempSync(join(tmpdir(), "pf-sync-"));
const db = new DatabaseSync(join(dir, "m.sqlite"));
db.exec(prepared);
const tables = db
  .prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  )
  .all()
  .map((r) => r.name);

const columns = [];
for (const name of tables) {
  for (const c of db.prepare(`PRAGMA table_info(${name})`).all()) {
    columns.push(`${name}.${c.name}`);
  }
}
db.close();

const invLines = readFileSync(invPath, "utf8").trim().split("\n").slice(1);
const invSet = new Set(
  invLines.map((l) => {
    const [t, c] = l.split("\t");
    return `${t}.${c}`;
  }),
);
const missing = columns.filter((x) => !invSet.has(x));
const extra = [...invSet].filter((x) => !columns.includes(x) && !x.startsWith("."));

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const report = `# Schema Sync Report

Generated: ${new Date().toISOString()}

| Check | Result |
|-------|--------|
| Tables | ${tables.length} |
| Columns | ${columns.length} |
| Inventory rows | ${invLines.length} |
| Manifest hash | \`${String(manifest.schemaHash || "").slice(0, 16)}\` |
| Missing inventory | ${missing.length} |
| Extra inventory | ${extra.length} |

${missing.length ? "## Missing\n" + missing.map((m) => `- ${m}`).join("\n") : "## Missing\nNone"}

${extra.length ? "## Extra (not in schema)\n" + extra.slice(0, 50).map((m) => `- ${m}`).join("\n") : "## Extra\nNone (or only documented legacy)"}

## Pipeline

\`\`\`
schema.sql → schema-manifest.js → schema.manifest.json
schema.sql → field-inventory-verify → checklist.tsv coverage
\`\`\`

Release blocks if missing inventory > 0 or manifest check fails.
`;
console.log("schema-sync-pipeline: report emitted to stdout only");
if (missing.length) {
  console.error("schema-sync-pipeline: missing inventory", missing.length);
  process.exit(1);
}
if (extra.length) {
  console.error("schema-sync-pipeline: extra inventory", extra.length, extra.slice(0, 20));
  process.exit(1);
}
console.log("schema-sync-pipeline: OK", tables.length, "tables", columns.length, "cols");
