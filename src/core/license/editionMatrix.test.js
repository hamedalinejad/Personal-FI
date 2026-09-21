import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCommandAllowed, EDITIONS } from "./capabilityGate.js";
import { COMMAND_REGISTRY } from "../../application/commandRegistry.js";
import { proveEditionMatrix } from "./entitlementContract.js";

const EDITION_IDS = ["standalone", "free", "pro"];

describe("standalone editions PHASE 7", () => {
  it("known editions defined", () => {
    for (const e of EDITION_IDS) {
      assert.ok(EDITIONS[e], e);
    }
  });

  it("pro allows all registered commands", () => {
    for (const id of Object.keys(COMMAND_REGISTRY)) {
      if (COMMAND_REGISTRY[id].kind !== "command") continue;
      assert.equal(isCommandAllowed("pro", id), true, id);
    }
  });

  it("free blocks loan and crypto", () => {
    assert.equal(isCommandAllowed("free", "loan.create"), false);
    assert.equal(isCommandAllowed("free", "crypto.buy"), false);
    assert.equal(isCommandAllowed("free", "accounts.deposit"), true);
  });

  it("standalone allows core verticals in registry", () => {
    assert.equal(isCommandAllowed("standalone", "loan.create"), true);
    assert.equal(isCommandAllowed("standalone", "crypto.buy"), true);
    assert.equal(isCommandAllowed("standalone", "metals.buy"), true);
    assert.equal(isCommandAllowed("standalone", "tax.adjust"), true);
  });

  it("proveEditionMatrix returns allowed/denied partitions", () => {
    const m = proveEditionMatrix("free");
    assert.ok(m.allowed.length > 0);
    assert.ok(m.denied.length > 0);
    assert.ok(m.denied.includes("loan.create") || m.denied.includes("crypto.buy"));
  });

  it("loan-only conceptual filter: only loan.* + meta + reports subset", () => {
    // Conceptual edition: filter by capability prefix (product may add loan-only edition later)
    const loanOnlyCaps = ["loan.*", "meta.*", "reports.*", "backup.*", "accounts.*"];
    function allowed(cmd) {
      if (loanOnlyCaps.includes("*")) return true;
      for (const c of loanOnlyCaps) {
        if (c.endsWith(".*") && cmd.startsWith(c.slice(0, -1))) return true;
        if (c === cmd) return true;
      }
      return false;
    }
    assert.equal(allowed("loan.create"), true);
    assert.equal(allowed("loan.recordPayment"), true);
    assert.equal(allowed("crypto.buy"), false);
    assert.equal(allowed("metals.buy"), false);
  });
});
