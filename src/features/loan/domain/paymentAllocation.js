import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { assertPositive } from "../../../core/money/decimalMath.js";

/**
 * Waterfall: penalty → fee → interest → principal
 * Amounts are decimal strings.
 */
export function allocatePayment({ amount, outstanding }) {
  let remaining = assertPositive(amount, "PAYMENT_AMOUNT");
  const penDue = toDecimal(outstanding.penalty || "0");
  const feeDue = toDecimal(outstanding.fee || "0");
  const intDue = toDecimal(outstanding.interest || "0");
  const prinDue = toDecimal(outstanding.principal || "0");

  const penalty = remaining.gte(penDue) ? penDue : remaining;
  remaining = remaining.minus(penalty);
  const fee = remaining.gte(feeDue) ? feeDue : remaining;
  remaining = remaining.minus(fee);
  const interest = remaining.gte(intDue) ? intDue : remaining;
  remaining = remaining.minus(interest);
  const principal = remaining.gte(prinDue) ? prinDue : remaining;
  remaining = remaining.minus(principal);

  const allocated = penalty.plus(fee).plus(interest).plus(principal);
  return {
    penalty: penalty.toFixed(),
    fee: fee.toFixed(),
    interest: interest.toFixed(),
    principal: principal.toFixed(),
    total: allocated.toFixed(),
    unallocated: remaining.toFixed(),
  };
}

/** Build balanced journal lines from allocation */
export function allocationJournalLines({
  allocation,
  currency,
  cashAccountId,
  receivableAccountId,
  interestIncomeId,
  feeIncomeId,
  penaltyIncomeId,
}) {
  const lines = [];
  let n = 1;
  const total = toDecimal(allocation.total);
  if (total.lte(0)) throw new Error("PAYMENT_ZERO");

  lines.push({
    accountId: cashAccountId,
    side: "debit",
    amount: allocation.total,
    currency,
    line_number: n++,
  });

  const credit = (accountId, amount) => {
    const a = toDecimal(amount);
    if (a.lte(0)) return;
    lines.push({
      accountId,
      side: "credit",
      amount,
      currency,
      line_number: n++,
    });
  };

  credit(receivableAccountId, allocation.principal);
  credit(interestIncomeId, allocation.interest);
  credit(feeIncomeId, allocation.fee);
  credit(penaltyIncomeId, allocation.penalty);

  return lines;
}
