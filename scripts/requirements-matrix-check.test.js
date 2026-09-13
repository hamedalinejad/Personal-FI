import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

test("P0-04 live missing define path fails checker", () => {
  const dir = join(tmpdir(), `pf-rm-${Date.now()}`);
  mkdirSync(join(dir, "docs/core/registry"), { recursive: true });
  writeFileSync(
    join(dir, "docs/core/registry/requirements-matrix.json"),
    JSON.stringify({
      requirements: {
        "R-X01": {
          title: "x",
          status: "IMPLEMENTED",
          define: ["docs/DOES-NOT-EXIST.md"],
        },
      },
    }),
  );
  writeFileSync(join(dir, "scripts-check.js"), readChecker());
  // run from dir with copied script reading relative path
  const script = join(dir, "check.js");
  writeFileSync(script, readChecker());
  const r = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
  assert.notEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stderr + r.stdout, /missing live reference/);
  rmSync(dir, { recursive: true, force: true });
});

test("P0-04 HISTORICAL missing path allowed", () => {
  const dir = join(tmpdir(), `pf-rmh-${Date.now()}`);
  mkdirSync(join(dir, "docs/core/registry"), { recursive: true });
  writeFileSync(
    join(dir, "docs/core/registry/requirements-matrix.json"),
    JSON.stringify({
      requirements: {
        "R-H01": {
          title: "old",
          status: "HISTORICAL",
          define: ["docs/GONE.md"],
        },
      },
    }),
  );
  const script = join(dir, "check.js");
  writeFileSync(script, readChecker());
  const r = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  rmSync(dir, { recursive: true, force: true });
});

function readChecker() {
  return `import { readFileSync, existsSync } from "node:fs";
const reg = JSON.parse(readFileSync("docs/core/registry/requirements-matrix.json", "utf8"));
let failed = false;
for (const [id, r] of Object.entries(reg.requirements || {})) {
  const status = String(r.status || "").toUpperCase();
  const historical = ["HISTORICAL","DEFERRED","CLOSED_HISTORICAL"].includes(status);
  for (const p of r.define || []) {
    const path = String(p).split("#")[0];
    if (path && !existsSync(path)) {
      if (!historical) { console.error("missing live reference for", id, path); failed = true; }
    }
  }
}
process.exit(failed ? 1 : 0);
`;
}
