import test from "node:test";
import assert from "node:assert/strict";
import { assertScheduleConservation } from "./scheduleEngine.js";

test("P0 schedule conservation rejects one-cent principal mismatch", () => {
  assert.throws(
    () =>
      assertScheduleConservation(
        [
          { principal: "50.00", interest: "1.00" },
          { principal: "49.99", interest: "0.50" },
        ],
        { principal: "100.00", totalInterest: "1.50" },
      ),
    /LOAN_SCHEDULE_PRINCIPAL_MISMATCH/,
  );
});

test("P0 schedule conservation accepts exact sum", () => {
  assert.equal(
    assertScheduleConservation(
      [
        { principal: "50.00", interest: "1.00" },
        { principal: "50.00", interest: "0.50" },
      ],
      { principal: "100.00", totalInterest: "1.50" },
    ),
    true,
  );
});
