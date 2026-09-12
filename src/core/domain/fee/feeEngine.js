/**
 * BUG-011 — Canonical Fee Engine (Core)
 * Features select policy; Core applies treatment → journal legs + carrying adjustment.
 *
 * Treatments (Fee Treatment Matrix):
 * - expense: P&L expense (does not increase asset carrying)
 * - capitalized_cost: added to asset carrying / inventory cost
 * - fee_from_received: reduces received quantity (asset side); cash cost unchanged
 * - from_cash: explicit cash out already in principal (no extra leg) — informational
 */

import { toDecimal } from "../../money/canonicalDecimal.js";
import { scopedAccountId } from "../../accounting/chartOfAccounts.js";

/**
 * @typedef {object} CanonicalFeeEvent
 * @property {string} feeAmount - decimal string
 * @property {string} feeCurrency
 * @property {string} [feeInstrumentId]
 * @property {string} treatment - expense | capitalized_cost | fee_from_received | from_cash
 * @property {string} [feeExchangeRateToBase]
 * @property {string} baseCurrency
 * @property {string} transactionCurrency - principal/cost currency
 * @property {string} exchangeRateToBase - principal FX to base
 * @property {string} [expenseAccountId]
 * @property {string} [cashAccountId]
 */

/**
 * Normalize feature fee inputs into CanonicalFeeEvent[].
 */
export function buildFeeEvents(inputs = [], ctx = {}) {
  const {
    baseCurrency,
    transactionCurrency,
    exchangeRateToBase = "1",
  } = ctx;
  return (inputs || [])
    .filter((f) => f && f.feeAmount != null && f.feeAmount !== "" && !toDecimal(f.feeAmount).isZero())
    .map((f) => ({
      feeAmount: toDecimal(f.feeAmount).toFixed(),
      feeCurrency: f.feeCurrency || transactionCurrency,
      feeInstrumentId: f.feeInstrumentId || null,
      treatment: f.treatment || f.feeTreatment || "expense",
      feeExchangeRateToBase: f.feeExchangeRateToBase ?? null,
      baseCurrency,
      transactionCurrency,
      exchangeRateToBase,
      expenseAccountId: f.expenseAccountId || null,
      cashAccountId: f.cashAccountId || null,
      label: f.label || "fee",
    }));
}

function feeAmountInBase(event) {
  const amt = toDecimal(event.feeAmount);
  const feeCurrency = event.feeCurrency;
  if (feeCurrency === event.baseCurrency) return amt;
  if (feeCurrency === event.transactionCurrency) {
    return amt.times(toDecimal(event.exchangeRateToBase));
  }
  if (event.feeExchangeRateToBase != null) {
    return amt.times(toDecimal(event.feeExchangeRateToBase));
  }
  throw new Error("VALIDATION_ERROR:feeExchangeRateToBase");
}

/**
 * Apply fee events: returns { carryingDeltaBase, quantityDelta, journalLines, derivedFeeBases }
 * quantityDelta is negative string for fee_from_received (caller applies to gross qty).
 */
export function applyFeeEvents(events, { expenseAccountId, cashAccountId, receivedInstrumentId, receivedQuantityUnit, transactionCurrency } = {}) {
  let carryingDeltaBase = toDecimal("0");
  let carryingDeltaTx = toDecimal("0");
  let quantityDelta = toDecimal("0");
  const journalLines = [];
  const derivedFeeBases = [];
  const txCcy = transactionCurrency || (events[0] && events[0].transactionCurrency) || null;

  for (const event of events) {
    const inBase = feeAmountInBase(event);
    derivedFeeBases.push({
      label: event.label,
      treatment: event.treatment,
      feeAmount: event.feeAmount,
      feeCurrency: event.feeCurrency,
      feeAmountBase: inBase.toFixed(),
      feeInstrumentId: event.feeInstrumentId,
    });

    switch (event.treatment) {
      case "capitalized_cost":
        // Dimension-safe: base always accumulates fee-in-base; TX only if same currency
        carryingDeltaBase = carryingDeltaBase.plus(inBase);
        if (txCcy && event.feeCurrency === txCcy) {
          carryingDeltaTx = carryingDeltaTx.plus(toDecimal(event.feeAmount));
        }
        break;
      case "expense": {
        const expId =
          event.expenseAccountId ||
          expenseAccountId ||
          scopedAccountId("fee_expense", event.baseCurrency);
        const cashId =
          event.cashAccountId ||
          cashAccountId ||
          scopedAccountId("local_settlement_cash", event.feeCurrency);
        journalLines.push(
          {
            accountId: expId,
            side: "debit",
            amount: event.feeAmount,
            currency: event.feeCurrency,
            amountInBase: inBase.toFixed(),
            exchangeRateToBase:
              event.feeCurrency === event.baseCurrency
                ? "1"
                : event.feeCurrency === event.transactionCurrency
                  ? event.exchangeRateToBase
                  : event.feeExchangeRateToBase,
            lineKind: "fee",
          },
          {
            accountId: cashId,
            side: "credit",
            amount: event.feeAmount,
            currency: event.feeCurrency,
            amountInBase: inBase.toFixed(),
            exchangeRateToBase:
              event.feeCurrency === event.baseCurrency
                ? "1"
                : event.feeCurrency === event.transactionCurrency
                  ? event.exchangeRateToBase
                  : event.feeExchangeRateToBase,
            lineKind: "fee",
          },
        );
        break;
      }
      case "fee_from_received": {
        // Quantity fee on received asset — never a foreign cash currency leg
        if (event.feeInstrumentId && receivedInstrumentId && event.feeInstrumentId !== receivedInstrumentId) {
          throw new Error("FEE_UNIT_MISMATCH");
        }
        // Explicit cash fee currency that is not the principal asset marker is invalid for quantity burn
        if (
          receivedQuantityUnit === "asset" &&
          event.feeInstrumentId == null &&
          event.feeCurrency &&
          event.transactionCurrency &&
          event.feeCurrency !== event.transactionCurrency &&
          event.feeCurrency !== event.baseCurrency
        ) {
          throw new Error("FEE_UNIT_MISMATCH");
        }
        quantityDelta = quantityDelta.minus(toDecimal(event.feeAmount));
        break;
      }
      case "from_cash":
        // already embedded in principal cash out — no extra journal
        break;
      default:
        throw new Error(`FEE_TREATMENT_INVALID:${event.treatment}`);
    }
  }

  return {
    carryingDeltaBase: carryingDeltaBase.toFixed(),
    carryingDeltaTx: { amount: carryingDeltaTx.toFixed(), currency: txCcy },
    carryingDeltaBaseDim: { amount: carryingDeltaBase.toFixed(), currency: "BASE" },
    /** @deprecated — use carryingDeltaTx (TX) or carryingDeltaBaseDim (BASE) */
    carryingDelta: { amount: carryingDeltaBase.toFixed(), currency: "BASE", deprecated: true },
    quantityDelta: quantityDelta.isZero() ? "0" : quantityDelta.toFixed(),
    journalLines,
    derivedFeeBases,
  };
}

/**
 * Single-fee convenience for feature commands.
 */
export function applySingleFee(feeInput, ctx = {}) {
  const events = buildFeeEvents(feeInput ? [feeInput] : [], ctx);
  return applyFeeEvents(events, {
    expenseAccountId: feeInput?.expenseAccountId || ctx.expenseAccountId,
    cashAccountId: feeInput?.cashAccountId || ctx.cashAccountId,
    receivedInstrumentId: ctx.receivedInstrumentId || feeInput?.receivedInstrumentId,
    receivedQuantityUnit: ctx.receivedQuantityUnit || feeInput?.receivedQuantityUnit || "asset",
    transactionCurrency: ctx.transactionCurrency,
  });
}
