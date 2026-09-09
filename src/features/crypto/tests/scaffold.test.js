import test from "node:test";
import assert from "node:assert/strict";
import { capabilities } from "../public-api/index.js";

test("crypto scaffold capabilities", () => {
  const c = capabilities();
  assert.equal(c.edition, "crypto-only");
  assert.equal(c.status, "SPECIFIED");
});
