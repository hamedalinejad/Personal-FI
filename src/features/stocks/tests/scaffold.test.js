import test from "node:test";
import assert from "node:assert/strict";
import { capabilities } from "../public-api/index.js";

test("stocks scaffold capabilities", () => {
  const c = capabilities();
  assert.equal(c.edition, "stocks-only");
  assert.equal(c.status, "SPECIFIED");
});
