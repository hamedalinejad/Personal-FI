import { readFileSync, existsSync } from "node:fs";
const reg = JSON.parse(readFileSync("docs/core/registry/requirements-matrix.json", "utf8"));
const ids = Object.keys(reg.requirements);
if (ids.length !== 30) {
  console.error("expected 30 R-M keys, got", ids.length);
  process.exit(1);
}
for (let i = 1; i <= 30; i++) {
  const id = `R-M${String(i).padStart(2, "0")}`;
  if (!reg.requirements[id]) {
    console.error("missing", id);
    process.exit(1);
  }
  const r = reg.requirements[id];
  if (!r.title || !r.status) {
    console.error("incomplete", id);
    process.exit(1);
  }
  for (const p of r.define || []) {
    const path = p.split("#")[0];
    if (!existsSync(path)) {
      console.warn("WARN missing path for", id, path);
    }
  }
}
console.log("requirements-matrix-check: OK", ids.length);
