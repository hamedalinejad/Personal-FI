import { settle as lowLevelSettle } from "./settlementAdapter.js";

/**
 * Feature-facing cash settlement port (canonical).
 * Translates to internal journal-plan primitives.
 */
export function settleCash({
  operationId,
  amount,
  currency,
  direction,
  businessDate,
  memo,
  finAccountId,
  counterAccountId,
}) {
  if (!operationId) throw new Error("SETTLE_OPERATION_REQUIRED");
  if (!businessDate) throw new Error("OP_BUSINESS_DATE_REQUIRED");
  if (!currency) throw new Error("OP_BASE_CURRENCY_REQUIRED");
  if (!finAccountId || !counterAccountId) throw new Error("SETTLE_ACCOUNT_REQUIRED");
  if (direction !== "in" && direction !== "out") throw new Error("SETTLE_DIRECTION");

  // direction in = money into finAccount (credit cash in our settle convention for loan disbursement was credit cash out)
  // Canonical: direction out = money leaves cash account → debit cash
  const side = direction === "out" ? "debit" : "credit";
  const plan = lowLevelSettle({
    finAccountId,
    counterAccountId,
    amount,
    side,
    operationId,
    memo: memo || "settlement",
  });
  for (const line of plan.journalLines) {
    line.currency = currency;
  }
  return { ...plan, businessDate, currency, direction };
}
