#!/usr/bin/env node
/**
 * BUG-FINAL-040 — fail if journal/ops schema confuses channel enum with type.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sql = fs.readFileSync(path.join(root, "docs/core/db/schema.sql"), "utf8");

// fin_operations must have source_channel with ui|api
if (!/source_channel\s+TEXT CHECK \(source_channel IS NULL OR source_channel IN \('ui'/.test(sql)) {
  console.error("SOURCE_VOCAB: fin_operations.source_channel enum missing");
  process.exit(1);
}
// journal lines must NOT constrain source_type to ui|api only
const jl = sql.split("CREATE TABLE IF NOT EXISTS fin_journal_lines")[1]?.split("CREATE TABLE")[0] || "";
if (/source_type TEXT CHECK \(source_type IS NULL OR source_type IN \('ui'/.test(jl)) {
  console.error("SOURCE_VOCAB: fin_journal_lines.source_type still uses channel enum");
  process.exit(1);
}
if (!/source_channel TEXT CHECK \(source_channel IS NULL OR source_channel IN \('ui'/.test(jl)) {
  console.error("SOURCE_VOCAB: fin_journal_lines.source_channel missing");
  process.exit(1);
}
console.log("source-vocab-check: OK");
