/**
 * Canonical Fee Engine (Core)
 * Owner: docs/FINANCIAL-CORE.md
 *
 * Canonical treatments (only these after normalize):
 * - expense
 * - capitalize_inventory
 * - reduce_proceeds
 * - reduce_received_quantity
 * - embedded_in_gross_cash
 * - equity_adjustment
 *
 * Legacy API aliases (normalize only, not stored in Core after normalize):
 * - capitalized_cost → capitalize_inventory
 * - fee_from_received → reduce_received_quantity
 * - from_cash → embedded_in_gross_cash
 */

import { toDecimal } from "../../money/canonicalDecimal.js";
import { scopedAccountId } from "../../accounting/chartOfAccounts.js";

export const CANONICAL_FEE_TREATMENTS = Object.freeze([
  "expense",
  "capitalize_inventory",
  "reduce_proceeds",
  "reduce_received_quantity",
  "embedded_in_gross_cash",
  "equity_adjustment",
]);

const TREATMENT_ALIASES = Object.freeze({
  capitalized_cost: "capitalize_inventory",
  fee_from_received: "reduce_received_quantity",
  feeBurnQuantity: "reduce_received_quantity",
  from_cash: "embedded_in_gross_cash",
});

/**
 * Map legacy synonym → canonical. Throws if missing or unknown.
 * @param {string|null|undefined} raw
 * @param {{ allowMissing?: boolean }} [opts]
 */
export function normalizeFeeTreatment(raw, opts = {}) {
  if (raw == null || raw === "") {
    if (opts.allowMissing) return null;
    throw new Error("FEE_TREATMENT_REQUIRED");
  }
  const key = String(raw);
  const canonical = TREATMENT_ALIASES[key] || key;
  if (!CANONICAL_FEE_TREATMENTS.includes(canonical)) {
    throw new Error(`FEE_TREATMENT_INVALID:${raw}`);
  }
  return canonical;
}

/**
 * @typedef {object} CanonicalFeeEvent
 * @property {string} [feeAmount] - monetary fee (decimal string)
 * @property {string} [feeQuantity] - quantity fee for reduce_received_quantity
 * @property {string} [feeQuantityUnit]
 * @property {string} feeCurrency
 * @property {string} [feeInstrumentId]
 * @property {string} treatment - canonical only
 * @property {string} [feeExchangeRateToBase]
 * @property {string} baseCurrency
 * @property {string} transactionCurrency
 * @property {string} exchangeRateToBase
 */

/**
 * Normalize feature fee inputs into CanonicalFeeEvent[].
 * Treatment is required (no silent expense default).
 */
export function buildFeeEvents(inputs = [], ctx = {}) {
  const {
    baseCurrency,
    transactionCurrency,
    exchangeRateToBase = "1",
  } = ctx;
  return (inputs || [])
    .filter((f) => {
      if (!f) return false;
      const hasMoney = f.feeAmount != null && f.feeAmount !== "" && !toDecimal(f.feeAmount).isZero();
      const hasQty = f.feeQuantity != null && f.feeQuantity !== "" && !toDecimal(f.feeQuantity).isZero();
      return hasMoney || hasQty;
    })
    .map((f) => {
      const treatment = normalizeFeeTreatment(f.treatment ?? f.feeTreatment ?? f.feeRole);
      const event = {
        feeAmount:
          f.feeAmount != null && f.feeAmount !== ""
            ? toDecimal(f.feeAmount).toFixed()
            : null,
        feeQuantity:
          f.feeQuantity != null && f.feeQuantity !== ""
            ? toDecimal(f.feeQuantity).toFixed()
            : null,
        feeQuantityUnit: f.feeQuantityUnit || null,
        feeCurrency: f.feeCurrency || transactionCurrency,
        feeInstrumentId: f.feeInstrumentId || null,
        treatment,
        feeExchangeRateToBase: f.feeExchangeRateToBase ?? null,
        baseCurrency,
        transactionCurrency,
        exchangeRateToBase,
        expenseAccountId: f.expenseAccountId || null,
        cashAccountId: f.cashAccountId || null,
        inventoryAccountId: f.inventoryAccountId || null,
        inventoryRole: f.inventoryRole || null,
        label: f.label || "fee",
      };
      if (treatment === "reduce_received_quantity") {
        // money amount must NOT be used as quantity
        if (event.feeQuantity == null) {
          throw new Error("FEE_QUANTITY_REQUIRED");
        }
        if (toDecimal(event.feeQuantity).isNegative()) {
          throw new Error("FEE_QUANTITY_NEGATIVE");
        }
      } else if (event.feeAmount == null) {
        throw new Error("FEE_AMOUNT_REQUIRED");
      }
      return event;
    });
}

function feeAmountInBase(event) {
  const amt = toDecimal(event.feeAmount || "0");
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
 * Apply fee events: returns { carryingDeltaBase, carryingDeltaTx, quantityDelta, journalLines, derivedFeeBases }
 */
export function applyFeeEvents(
  events,
  {
    expenseAccountId,
    cashAccountId,
    receivedInstrumentId,
    receivedQuantityUnit,
    transactionCurrency,
  } = {},
) {
  let carryingDeltaBase = toDecimal("0");
  let carryingDeltaTx = toDecimal("0");
  let quantityDelta = toDecimal("0");
  const journalLines = [];
  const derivedFeeBases = [];
  const txCcy = transactionCurrency || (events[0] && events[0].transactionCurrency) || null;

  for (const event of events) {
    const treatment = normalizeFeeTreatment(event.treatment);
    const inBase =
      treatment === "reduce_received_quantity" ? toDecimal("0") : feeAmountInBase(event);
    derivedFeeBases.push({
      label: event.label,
      treatment,
      feeAmount: event.feeAmount,
      feeQuantity: event.feeQuantity,
      feeCurrency: event.feeCurrency,
      feeAmountBase: inBase.toFixed(),
      feeInstrumentId: event.feeInstrumentId,
    });

    switch (treatment) {
      case "capitalize_inventory": {
        carryingDeltaBase = carryingDeltaBase.plus(inBase);
        if (txCcy && event.feeCurrency === txCcy) {
          carryingDeltaTx = carryingDeltaTx.plus(toDecimal(event.feeAmount));
        }
        const invId =
          event.inventoryAccountId ||
          event.assetAccountId ||
          scopedAccountId(
            event.inventoryRole || "crypto_inventory",
            event.feeCurrency === (event.transactionCurrency || txCcy)
              ? event.transactionCurrency || txCcy || event.feeCurrency
              : event.feeCurrency,
          );
        const cashId =
          event.cashAccountId ||
          cashAccountId ||
          scopedAccountId("local_settlement_cash", event.feeCurrency);
        const fx =
          event.feeCurrency === event.baseCurrency
            ? "1"
            : event.feeCurrency === event.transactionCurrency
              ? event.exchangeRateToBase
              : event.feeExchangeRateToBase;
        journalLines.push(
          {
            accountId: invId,
            side: "debit",
            amount: event.feeAmount,
            currency: event.feeCurrency,
            amountInBase: inBase.toFixed(),
            exchangeRateToBase: fx,
            lineKind: "fee",
          },
          {
            accountId: cashId,
            side: "credit",
            amount: event.feeAmount,
            currency: event.feeCurrency,
            amountInBase: inBase.toFixed(),
            exchangeRateToBase: fx,
            lineKind: "fee",
          },
        );
        break;
      }
      case "expense":
      case "equity_adjustment": {
        const expId =
          event.expenseAccountId ||
          expenseAccountId ||
          scopedAccountId(
            treatment === "equity_adjustment" ? "fee_equity" : "fee_expense",
            event.feeCurrency,
          );
        const cashId =
          event.cashAccountId ||
          cashAccountId ||
          scopedAccountId("local_settlement_cash", event.feeCurrency);
        const fx =
          event.feeCurrency === event.baseCurrency
            ? "1"
            : event.feeCurrency === event.transactionCurrency
              ? event.exchangeRateToBase
              : event.feeExchangeRateToBase;
        journalLines.push(
          {
            accountId: expId,
            side: "debit",
            amount: event.feeAmount,
            currency: event.feeCurrency,
            amountInBase: inBase.toFixed(),
            exchangeRateToBase: fx,
            lineKind: "fee",
          },
          {
            accountId: cashId,
            side: "credit",
            amount: event.feeAmount,
            currency: event.feeCurrency,
            amountInBase: inBase.toFixed(),
            exchangeRateToBase: fx,
            lineKind: "fee",
          },
        );
        break;
      }
      case "reduce_proceeds": {
        // reduces net cash proceeds (sell side); credit inventory/income handled by feature principal
        const cashId =
          event.cashAccountId ||
          cashAccountId ||
          scopedAccountId("local_settlement_cash", event.feeCurrency);
        const expId =
          event.expenseAccountId ||
          expenseAccountId ||
          scopedAccountId("fee_expense", event.feeCurrency);
        const fx =
          event.feeCurrency === event.baseCurrency
            ? "1"
            : event.feeCurrency === event.transactionCurrency
              ? event.exchangeRateToBase
              : event.feeExchangeRateToBase;
        journalLines.push(
          {
            accountId: expId,
            side: "debit",
            amount: event.feeAmount,
            currency: event.feeCurrency,
            amountInBase: inBase.toFixed(),
            exchangeRateToBase: fx,
            lineKind: "fee",
          },
          {
            accountId: cashId,
            side: "credit",
            amount: event.feeAmount,
            currency: event.feeCurrency,
            amountInBase: inBase.toFixed(),
            exchangeRateToBase: fx,
            lineKind: "fee",
          },
        );
        break;
      }
      case "reduce_received_quantity": {
        if (!receivedInstrumentId) {
          throw new Error("FEE_FROM_RECEIVED_CONTEXT_REQUIRED");
        }
        if (event.feeInstrumentId && event.feeInstrumentId !== receivedInstrumentId) {
          throw new Error("FEE_UNIT_MISMATCH");
        }
        if (event.feeQuantityUnit && receivedQuantityUnit && event.feeQuantityUnit !== receivedQuantityUnit) {
          throw new Error("FEE_UNIT_MISMATCH");
        }
        if (event.feeQuantity == null) {
          throw new Error("FEE_QUANTITY_REQUIRED");
        }
        quantityDelta = quantityDelta.minus(toDecimal(event.feeQuantity));
        break;
      }
      case "embedded_in_gross_cash": {
        // informational — cash already in principal legs
        break;
      }
      default:
        throw new Error(`FEE_TREATMENT_INVALID:${treatment}`);
    }
  }

  return {
    carryingDeltaBase: carryingDeltaBase.toFixed(),
    carryingDeltaTx: carryingDeltaTx.toFixed(),
    // structured form for multi-currency callers
    carryingDeltaTxDetail: { amount: carryingDeltaTx.toFixed(), currency: txCcy },
    quantityDelta: quantityDelta.toFixed(),
    journalLines,
    derivedFeeBases,
  };
}

export function applySingleFee(feeInput, ctx) {
  if (!feeInput) {
    return {
      carryingDeltaBase: "0",
      carryingDeltaTx: "0",
      carryingDeltaTxDetail: { amount: "0", currency: null },
      quantityDelta: "0",
      journalLines: [],
      derivedFeeBases: [],
    };
  }
  const events = buildFeeEvents([feeInput], ctx);
  return applyFeeEvents(events, {
    expenseAccountId: feeInput?.expenseAccountId || ctx.expenseAccountId,
    cashAccountId: feeInput?.cashAccountId || ctx.cashAccountId,
    receivedInstrumentId: ctx.receivedInstrumentId,
    receivedQuantityUnit: ctx.receivedQuantityUnit,
    transactionCurrency: ctx.transactionCurrency,
  });
}
