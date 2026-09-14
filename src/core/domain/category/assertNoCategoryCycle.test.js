import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb, closeAllDbs } from "../../persistence/worker.js";
import { assertNoCategoryCycle } from "./assertNoCategoryCycle.js";

test("category cycle rejected", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-cat-"));
  const db = openDb(dataDir);
  db.prepare(`INSERT INTO cat_categories (id, name, kind, parent_id, is_active) VALUES ('a','A','expense',NULL,1)`).run();
  db.prepare(`INSERT INTO cat_categories (id, name, kind, parent_id, is_active) VALUES ('b','B','expense','a',1)`).run();
  assert.throws(() => assertNoCategoryCycle(db, { id: "a", parentId: "b" }), /CATEGORY_CYCLE/);
  assert.equal(assertNoCategoryCycle(db, { id: "c", parentId: "b" }), true);
  closeAllDbs();
});
