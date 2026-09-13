import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb, closeAllDbs } from "../persistence/port.js";
import { setBookBaseCurrency, getBookBaseCurrency } from "./bookSettings.js";

test("cycle-21 book base currency roundtrip", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-book-"));
  const db = openDb(dataDir);
  setBookBaseCurrency(db, "IRR");
  assert.equal(getBookBaseCurrency(dataDir), "IRR");
  closeAllDbs();
});
