import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isCommandAllowed,
  assertCommandAllowed,
  getRuntimeCapabilities,
  EDITIONS,
} from "./capabilityGate.js";

describe("capabilityGate", () => {
  it("standalone allows accounts.deposit", () => {
    assert.equal(isCommandAllowed("standalone", "accounts.deposit"), true);
  });

  it("free edition blocks loan.create", () => {
    assert.equal(isCommandAllowed("free", "loan.create"), false);
  });

  it("assert throws LICENSE_REQUIRED", () => {
    assert.throws(() => assertCommandAllowed("free", "crypto.buy"), /LICENSE_REQUIRED/);
  });

  it("pro allows everything", () => {
    assert.equal(isCommandAllowed("pro", "anything.here"), true);
  });

  it("runtime capabilities expose edition label", () => {
    const caps = getRuntimeCapabilities("standalone");
    assert.equal(caps.edition, "standalone");
    assert.ok(caps.capabilities.length > 0);
    assert.equal(caps.allowed("accounts.deposit"), true);
  });

  it("editions are frozen", () => {
    assert.ok(Object.isFrozen(EDITIONS));
  });
});
