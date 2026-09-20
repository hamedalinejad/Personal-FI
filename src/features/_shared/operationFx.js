/**
 * Unified money operation FX resolution.
 * Wave-4 / P0: no financial command may silently treat transaction currency as book base.
 * requireFxIfCrossCurrency is mandatory.
 */

import { toDecimal, canonicalDecimalString } from "../../core/money/canonicalDecimal.js";

/**
 * @param {{ bookBaseCurrency: string, transactionCurrency: string, fxRate?: string|null, amount: string }} input
 * @returns {{ amountInTxn: string, amountInBase: string, fxRate: string, isCross: boolean }}
 */
export function resolveMoneyOperationFx(input) {
  const { bookBaseCurrency, transactionCurrency, amount } = input;
  if (!bookBaseCurrency || typeof bookBaseCurrency !== "string") {
    throw new Error("BOOK_BASE_CURRENCY_REQUIRED");
  }
  if (!transactionCurrency || typeof transactionCurrency !== "string") {
    throw new Error("TRANSACTION_CURRENCY_REQUIRED");
  }
  const amountStr = canonicalDecimalString(String(amount));
  const amountDec = toDecimal(amountStr);
  if (amountDec.lte(0)) {
    throw new Error("AMOUNT_MUST_BE_POSITIVE");
  }

  const isCross = bookBaseCurrency !== transactionCurrency;
  if (!isCross) {
    return {
      amountInTxn: amountStr,
      amountInBase: amountStr,
      fxRate: "1",
      isCross: false,
    };
  }

  if (input.fxRate == null || input.fxRate === "") {
    throw new Error("FX_REQUIRED_FOR_CROSS_CURRENCY");
  }
  const fxStr = canonicalDecimalString(String(input.fxRate));
  const fxDec = toDecimal(fxStr);
  if (fxDec.lte(0)) {
    throw new Error("FX_MUST_BE_POSITIVE");
  }
  const amountInBase = amountDec.times(fxDec).toFixed();
  return {
    amountInTxn: amountStr,
    amountInBase: canonicalDecimalString(amountInBase),
    fxRate: fxStr,
    isCross: true,
  };
}

/**
 * Build a balanced journal pair (debit + credit) in base currency.
 * @param {{ debitAccountId: string, creditAccountId: string, amountInBase: string, memo?: string }} p
 */
export function journalPair(p) {
  const amt = canonicalDecimalString(String(p.amountInBase));
  return {
    lines: [
      { accountId: p.debitAccountId, side: "debit", amount: amt },
      { accountId: p.creditAccountId, side: "credit", amount: amt },
    ],
    memo: p.memo || null,
  };
}
