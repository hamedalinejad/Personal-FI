import test from "node:test";
import assert from "node:assert/strict";
import { capabilities } from "../public-api/index.js";

test("funds scaffold capabilities", () => {
  const c = capabilities();
  assert.equal(c.edition, "funds-only");
  assert.equal(c.status, "SPECIFIED");
});
