import { assertFiniteMoney } from "../invariants/index.js";
import { toNum } from "../../money/decimalMath.js";

/**
 * CashSettlementPort — returns journal lines only; never a feature balance SoT
 */
export function settle({
  finAccountId,
  counterAccountId,
  amount,
  side = "credit", // credit to cash account = money in
  operationId,
  memo = "settlement",
}) {
  if (!finAccountId || !counterAccountId) throw new Error("SETTLE_ACCOUNT_REQUIRED");
  assertFiniteMoney(amount, "amount");
  if (!(toNum(amount) > 0)) throw new Error("SETTLE_AMOUNT_POSITIVE");
  if (!operationId) throw new Error("SETTLE_OPERATION_REQUIRED");

  const cashSide = side;
  const otherSide = side === "debit" ? "credit" : "debit";
  return {
    operationId,
    journalLines: [
      { accountId: finAccountId, side: cashSide, amount, memo },
      { accountId: counterAccountId, side: otherSide, amount, memo },
    ],
    // explicit: no balance field as SoT
  };
}

/** T+2 style: trade day accrues payable; settlement day moves cash */
export function settleT2Broker({
  brokerFinAccountId,
  payableAccountId,
  amount,
  operationId,
  phase, // 'trade' | 'settlement'
}) {
  assertFiniteMoney(amount);
  if (phase === "trade") {
    // broker receivable/payable recognition (simplified)
    return settle({
      finAccountId: payableAccountId,
      counterAccountId: brokerFinAccountId,
      amount,
      side: "credit",
      operationId,
      memo: "t2_trade_payable",
    });
  }
  if (phase === "settlement") {
    return settle({
      finAccountId: brokerFinAccountId,
      counterAccountId: payableAccountId,
      amount,
      side: "debit",
      operationId,
      memo: "t2_settlement_cash",
    });
  }
  throw new Error("SETTLE_T2_PHASE");
}
