import test from "node:test";
import assert from "node:assert/strict";
import { capabilities } from "../public-api/index.js";

test("metals scaffold capabilities", () => {
  const c = capabilities();
  assert.equal(c.edition, "metals-only");
  assert.equal(c.status, "SPECIFIED");
});
