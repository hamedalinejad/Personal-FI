/**
 * P2-06 — Reversal is a new operation with inverse journal; never in-place rewrite.
 */
import { canonicalDecimalString } from "../../money/canonicalDecimal.js";

/**
 * Build inverse journal lines from original posted lines.
 * Debit ↔ Credit; amounts preserved as positive decimal strings.
 */
export function buildInverseJournalLines(originalLines) {
  if (!Array.isArray(originalLines) || originalLines.length < 2) {
    throw new Error("REVERSAL_REQUIRES_JOURNAL");
  }
  return originalLines.map((line, i) => {
    if (!line.side || (line.side !== "debit" && line.side !== "credit")) {
      throw new Error("REVERSAL_LINE_SIDE");
    }
    const side = line.side === "debit" ? "credit" : "debit";
    const amount = canonicalDecimalString(line.amount);
    const out = {
      accountId: line.accountId || line.account_id,
      side,
      amount,
      currency: line.currency,
      line_number: i + 1,
      lineKind: line.lineKind || line.line_kind || "adjustment",
      reference: line.reference || null,
      memo: line.memo ? `reversal:${line.memo}` : "reversal",
    };
    if (line.amountInBase != null || line.amount_in_base != null) {
      out.amountInBase = canonicalDecimalString(line.amountInBase ?? line.amount_in_base);
    }
    if (line.exchangeRateToBase != null || line.exchange_rate_to_base != null) {
      out.exchangeRateToBase = canonicalDecimalString(
        line.exchangeRateToBase ?? line.exchange_rate_to_base,
      );
    }
    if (line.conversionPath != null) out.conversionPath = line.conversionPath;
    return out;
  });
}

/**
 * Validate reversal request against original operation row/result.
 */
export function assertReversalAllowed(original) {
  if (!original) throw new Error("REVERSAL_ORIGINAL_NOT_FOUND");
  const status = original.status;
  if (status !== "posted") throw new Error("REVERSAL_ORIGINAL_NOT_POSTED");
  return true;
}
