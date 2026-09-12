import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureAccount,
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { resolveOrCreateInstrument, resolveOrCreateNamedMaster } from "../../../core/domain/instrument/resolve.js";

/**
 * stocks.buy — persists inv_stocks_iran_transactions; fee treatment explicit.
 */
export async function buyStock(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of ["instrumentId", "brokerageId", "quantity", "price", "currency", "tradeDate"]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }
  if (!p.businessDate) throw new Error("VALIDATION_ERROR:businessDate");
  if (!p.tradeDate) throw new Error("VALIDATION_ERROR:tradeDate");

  const qty = toDecimal(p.quantity);
  const price = toDecimal(p.price);
  const commission = toDecimal(p.commission || "0");
  const tax = toDecimal(p.tax || "0");
  const other = toDecimal(p.otherFee || "0");
  const gross = qty.times(price);
  const currency = p.currency;

  const commissionTreatment = p.commissionTreatment || "capitalized_cost";
  const taxTreatment = p.taxTreatment || "capitalized_cost";
  const otherTreatment = p.otherFeeTreatment || "capitalized_cost";

  let carrying = gross;
  let expenseTotal = toDecimal("0");
  for (const [amt, treatment] of [
    [commission, commissionTreatment],
    [tax, taxTreatment],
    [other, otherTreatment],
  ]) {
    if (treatment === "capitalized_cost") carrying = carrying.plus(amt);
    else if (treatment === "expense") expenseTotal = expenseTotal.plus(amt);
    else if (treatment === "proceeds_reduction") {
      /* sell-side */
    } else {
      throw new Error(`FEE_TREATMENT_INVALID:${treatment}`);
    }
  }

  const cashOut = gross.plus(commission).plus(tax).plus(other);
  const tradeDate = p.tradeDate;
  const settlementDate = p.settlementDate || null;
  if (settlementDate && settlementDate < tradeDate) {
    throw new Error("SETTLEMENT_BEFORE_TRADE");
  }
  if (settlementDate === tradeDate && p.allowSameDaySettlement !== true) {
    throw new Error("SETTLEMENT_SAME_DAY_REQUIRES_POLICY");
  }

  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const invId = scopedAccountId("stock_inventory", currency);
  const feeExpId = scopedAccountId("trade_fee_expense", currency);
  const now = new Date().toISOString();
  const holdingId = randomUUID();
  const txId = randomUUID();

  const journalLines = [
    {
      accountId: invId,
      side: "debit",
      amount: carrying.toFixed(),
      currency,
      amountInBase: carrying.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  ];
  if (expenseTotal.gt(0)) {
    journalLines.push({
      accountId: feeExpId,
      side: "debit",
      amount: expenseTotal.toFixed(),
      currency,
      amountInBase: expenseTotal.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "fee",
    });
  }
  journalLines.push({
    accountId: cashId,
    side: "credit",
    amount: cashOut.toFixed(),
    currency,
    amountInBase: cashOut.toFixed(),
    exchangeRateToBase: "1",
    lineKind: "principal",
  });

  return runAtomicFinancialOperation({
    operationId,
    type: "stocks.buy",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: {
      ...p,
      gross: gross.toFixed(),
      carrying: carrying.toFixed(),
      cashOut: cashOut.toFixed(),
      commissionTreatment,
      taxTreatment,
      otherTreatment,
    },
    journalLines,
    domainResult: {
      holdingId,
      transactionId: txId,
      carrying: carrying.toFixed(),
      total: cashOut.toFixed(),
      tradeDate,
      settlementDate,
      expectedSettlementDate: p.expectedSettlementDate || settlementDate,
      settlementPolicyVersion: p.settlementPolicyVersion || null,
      gross: gross.toFixed(),
    },
    engineVersions: { stocks: "1.1.0", money: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, currency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "stock",
        currency,
        displayName: "Stock investment",
      });
      if (expenseTotal.gt(0)) {
        ensureAccount(db, {
          id: feeExpId,
          name: `Trade fee expense (${currency})`,
          accountKind: "expense",
          currency,
          systemRole: "trade_fee_expense",
        });
      }

      resolveOrCreateNamedMaster(db, {
        table: "inv_stocks_iran_brokerages",
        id: p.brokerageId,
        existingSelect: `SELECT * FROM inv_stocks_iran_brokerages WHERE id = ?`,
        insertSql: `INSERT INTO inv_stocks_iran_brokerages (id, name, created_at) VALUES (?, ?, ?)`,
        insertArgs: [p.brokerageId, p.brokerageName || p.brokerageId, now],
      });
      if (!p.symbol) throw new Error("INSTRUMENT_SYMBOL_REQUIRED_ON_CREATE");
      resolveOrCreateInstrument(db, {
        instrumentId: p.instrumentId,
        assetClass: "stock",
        symbol: p.symbol,
        name: p.name || p.symbol,
        isin: p.isin || null,
        now,
      });

      db.prepare(
        `INSERT OR IGNORE INTO inv_stocks_iran_instruments (
          id, instrument_id, isin, lot_size, price_tick, firm_code, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        p.instrumentId,
        p.instrumentId,
        p.isin || null,
        p.lotSize || null,
        p.priceTick || null,
        p.firmCode || null,
        now,
      );

      let holding = db
        .prepare(
          `SELECT * FROM inv_stocks_iran_holdings WHERE brokerage_id = ? AND instrument_id = ?`,
        )
        .get(p.brokerageId, p.instrumentId);

      if (holding) {
        const newQty = toDecimal(holding.quantity).plus(qty);
        const newCost = toDecimal(holding.total_invested).plus(carrying);
        db.prepare(
          `UPDATE inv_stocks_iran_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
        ).run(newQty.toFixed(), newCost.toFixed(), now, holding.id);
      } else {
        db.prepare(
          `INSERT INTO inv_stocks_iran_holdings (
            id, brokerage_id, instrument_id, quantity, total_invested, cost_currency, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          holdingId,
          p.brokerageId,
          p.instrumentId,
          qty.toFixed(),
          carrying.toFixed(),
          currency,
          now,
          now,
        );
        holding = { id: holdingId };
      }

      const feeAmount = commission.plus(tax).plus(other);
      db.prepare(
        `INSERT INTO inv_stocks_iran_transactions (
          id, operation_id, holding_id, instrument_id, brokerage_id, tx_type,
          trade_date, settlement_date, quantity, price, fee_amount, currency, account_id, created_at
        ) VALUES (?, ?, ?, ?, ?, 'buy', ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        holding.id,
        p.instrumentId,
        p.brokerageId,
        tradeDate,
        settlementDate,
        qty.toFixed(),
        price.toFixed(),
        feeAmount.toFixed(),
        currency,
        p.accountId || null,
        now,
      );
    },
  });
}
