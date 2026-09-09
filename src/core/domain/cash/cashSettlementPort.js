import { settle as lowLevelSettle } from "./settlementAdapter.js";

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

  const side = direction === "out" ? "debit" : "credit";
  const plan = lowLevelSettle({
    finAccountId,
    counterAccountId,
    amount,
    currency,
    side,
    operationId,
    memo: memo || "settlement",
  });
  return { ...plan, businessDate, currency, direction };
}
