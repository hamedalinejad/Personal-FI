import { scopedAccountId } from "../../../core/accounting/chartOfAccounts.js";

/**
 * FUND-003 — ETF/fund cash uses the same CashSettlementPort / Accounts pattern as stocks.
 * No brokerage cash ledger. Journal is the only cash SoT.
 */
export function fundCashJournalLines({
  amount,
  currency,
  direction,
  cashAccountId = null,
  inventoryOrCounterId,
  amountInBase = null,
  exchangeRateToBase = "1",
  memo = "fund_cash",
}) {
  if (!inventoryOrCounterId) throw new Error("FUND_CASH_COUNTER_REQUIRED");
  const cashId = cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const cashSide = direction === "out" ? "credit" : "debit";
  const counterSide = direction === "out" ? "debit" : "credit";
  const base = amountInBase != null ? amountInBase : amount;
  return {
    cashAccountId: cashId,
    journalLines: [
      {
        accountId: inventoryOrCounterId,
        side: counterSide,
        amount,
        currency,
        amountInBase: base,
        exchangeRateToBase,
        lineKind: "principal",
        memo,
      },
      {
        accountId: cashId,
        side: cashSide,
        amount,
        currency,
        amountInBase: base,
        exchangeRateToBase,
        lineKind: "principal",
        memo,
      },
    ],
  };
}
