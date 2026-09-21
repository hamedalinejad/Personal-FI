/**
 * Opening balance = real financial operation (never setBalance).
 * Asset: Dr Asset, Cr Opening Equity
 * Liability: Dr Opening Equity, Cr Liability
 */

import { runAtomicFinancialOperation, newId } from "../domain/operation/operationRunner.js";
import { debit, credit } from "./journal.js";
import { canonicalDecimalString } from "../money/canonicalDecimal.js";

/**
 * @param {{ db: any, accountId: string, equityAccountId: string, amount: string, currency: string, accountKind: string, businessDate: string, baseCurrency: string, operationId?: string, durablePersist?: Function }} opts
 */
export async function postOpeningBalance({
  db,
  accountId,
  equityAccountId,
  amount,
  currency,
  accountKind,
  businessDate,
  baseCurrency,
  operationId = null,
  durablePersist = null,
}) {
  const amt = canonicalDecimalString(String(amount));
  const opId = operationId || newId("open");
  const isLiability =
    typeof accountKind === "string" &&
    (accountKind.startsWith("liability") || accountKind === "liability");

  const lines = isLiability
    ? [
        debit({ accountId: equityAccountId, amount: amt, currency, memo: "opening_equity" }),
        credit({ accountId, amount: amt, currency, memo: "opening_liability" }),
      ]
    : [
        debit({ accountId, amount: amt, currency, memo: "opening_asset" }),
        credit({ accountId: equityAccountId, amount: amt, currency, memo: "opening_equity" }),
      ];

  return runAtomicFinancialOperation({
    db,
    commandId: "accounts.openingBalance",
    payload: { accountId, equityAccountId, amount: amt, currency, accountKind },
    operationId: opId,
    businessDate,
    baseCurrency,
    sourceFeature: "accounts",
    durablePersist,
    apply: async () => ({
      journal: { lines, memo: "opening_balance" },
      resultData: { accountId, amount: amt },
    }),
  });
}
