import { readFileSync, writeFileSync } from "node:fs";
const reg = JSON.parse(readFileSync("docs/core/registry/status.registry.json", "utf8"));
let md = `---
id: DOC-CMD-STATUS
title: Feature Command Status Registry
status: approved
version: generated
updated: ${reg.updated}
generated_from: docs/core/registry/status.registry.json
---

# Generated — do not hand-edit status cells

Source of truth: \`docs/core/registry/status.registry.json\`

| Feature | Command | Status |
|---------|---------|--------|
`;
for (const [feat, body] of Object.entries(reg.features)) {
  for (const [cmd, st] of Object.entries(body.commands)) {
    md += `| ${feat} | ${cmd} | ${st} |\n`;
  }
}
md += `\nSurface levels and release flags live in the JSON registry.\nProduction: **${reg.release.production}**\n`;
writeFileSync("docs/core/command-coverage/FEATURE-COMMAND-STATUS.md", md);
console.log("generated FEATURE-COMMAND-STATUS.md");
