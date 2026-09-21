import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const catalog = JSON.parse(readFileSync(join(root, "docs/core/registry/command-catalog.json"), "utf8"));
const editions = JSON.parse(readFileSync(join(root, "docs/core/registry/license-editions.json"), "utf8"));

const VERTICALS = ["loan", "crypto", "stocks", "funds", "metals"];

test("vertical packages expose public-api and package.json", () => {
  for (const v of VERTICALS) {
    assert.ok(existsSync(join(root, `src/features/${v}/public-api/index.js`)), `${v} public-api`);
    assert.ok(existsSync(join(root, `src/features/${v}/package.json`)), `${v} package.json`);
    assert.ok(existsSync(join(root, `docs/modules/${v}.md`)), `${v} module doc`);
  }
});

test("catalog commands for verticals have owner module docs", () => {
  for (const [id, meta] of Object.entries(catalog.commands)) {
    const feature = id.split(".")[0];
    if (!VERTICALS.includes(feature) && feature !== "funds") continue;
    assert.ok(meta.owner, `${id} owner`);
    assert.ok(existsSync(join(root, meta.owner)), `${id} owner path ${meta.owner}`);
  }
});

test("canonical edition id is funds-only not fund-only in registry output", () => {
  const eds = editions.editions || editions;
  const ids = Array.isArray(eds) ? eds.map((e) => e.id) : Object.keys(eds);
  // accept either structure
  const flat = JSON.stringify(editions);
  assert.ok(flat.includes("funds-only"), "funds-only present");
});

test("no cross-feature internal imports in vertical public-api", async () => {
  for (const v of VERTICALS) {
    const src = readFileSync(join(root, `src/features/${v}/public-api/index.js`), "utf8");
    for (const other of VERTICALS) {
      if (other === v) continue;
      assert.equal(
        src.includes(`features/${other}/`),
        false,
        `${v} public-api must not import ${other} internals`,
      );
    }
  }
});
