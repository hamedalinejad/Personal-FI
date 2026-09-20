import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  assertTransition,
  isFinancialTransition,
  CHEQUE_TRANSITIONS,
} from "./stateMachine.js";

describe("cheque state machine BUG-P1-11/12", () => {
  it("issued → deposited allowed", () => {
    assert.equal(canTransition("issued", "deposited"), true);
  });

  it("issued → cancelled allowed", () => {
    assert.equal(canTransition("issued", "cancelled"), true);
  });

  it("deposited → cleared allowed", () => {
    assert.equal(canTransition("deposited", "cleared"), true);
  });

  it("deposited → bounced allowed", () => {
    assert.equal(canTransition("deposited", "bounced"), true);
  });

  it("cleared → bounced rejected", () => {
    assert.equal(canTransition("cleared", "bounced"), false);
    assert.throws(() => assertTransition("cleared", "bounced"), /CHEQUE_INVALID_TRANSITION/);
  });

  it("issued → cleared rejected", () => {
    assert.equal(canTransition("issued", "cleared"), false);
  });

  it("repeated deposit from deposited rejected", () => {
    assert.equal(canTransition("deposited", "deposited"), false);
  });

  it("cleared and bounced are financial transitions", () => {
    assert.equal(isFinancialTransition("cleared"), true);
    assert.equal(isFinancialTransition("bounced"), true);
    assert.equal(isFinancialTransition("cancelled"), false);
  });

  it("cancelled is terminal", () => {
    assert.deepEqual(CHEQUE_TRANSITIONS.cancelled, []);
  });

  it("bounced can re-deposit", () => {
    assert.equal(canTransition("bounced", "deposited"), true);
  });
});
