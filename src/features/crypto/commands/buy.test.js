import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/**
 * Pure conservation logic mirror of buy.js (no DB) for BUG-P0-03.
 */
function deriveNet(grossQuantity, feeQuantity, feeTreatment = "reduce_received") {
  const gross = toDecimal(String(grossQuantity));
  const feeQty = toDecimal(String(feeQuantity || "0"));
  if (gross.lte(0)) throw new Error("GROSS_MUST_BE_POSITIVE");
  if (feeQty.lt(0)) throw new Error("FEE_QTY_NEGATIVE");
  let net;
  if (feeTreatment === "reduce_received" || feeTreatment === "expense") {
    net = gross.minus(feeQty);
  } else {
    net = gross;
  }
  if (net.lt(0)) throw new Error("INV_QTY_CONSERVATION");
  return net;
}

function assertCallerNet(gross, fee, callerNet, treatment = "reduce_received") {
  const net = deriveNet(gross, fee, treatment);
  if (callerNet != null && callerNet !== "") {
    const supplied = toDecimal(String(callerNet));
    if (!supplied.eq(net)) {
      throw new Error(`INV_QTY_CONSERVATION: expected ${net.toFixed()} got ${supplied.toFixed()}`);
    }
  }
  return net;
}

describe("crypto.buy quantity conservation BUG-P0-03", () => {
  it("gross 1.5 fee 0.1 → net 1.4", () => {
    const net = deriveNet("1.5", "0.1");
    assert.equal(net.toFixed(), "1.4");
  });

  it("caller net matching derived is accepted", () => {
    const net = assertCallerNet("1.5", "0.1", "1.4");
    assert.equal(net.toFixed(), "1.4");
  });

  it("caller net mismatch is rejected", () => {
    assert.throws(() => assertCallerNet("1.5", "0.1", "1.5"), /INV_QTY_CONSERVATION/);
  });

  it("zero fee keeps net = gross", () => {
    assert.equal(deriveNet("2", "0").toFixed(), "2");
  });

  it("fee > gross rejected", () => {
    assert.throws(() => deriveNet("1", "2"), /INV_QTY_CONSERVATION/);
  });
});
