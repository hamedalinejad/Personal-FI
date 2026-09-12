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
import { buildFeeEvents, applyFeeEvents } from "../../../core/domain/fee/feeEngine.js";
import { computeEquitySettlementDate, SETTLEMENT_POLICY_VERSION } from "../../../core/iran/settlementPolicy.js";

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
  const baseCurrency = p.baseCurrency || currency;

  const feeEvents = buildFeeEvents(
    [
      { feeAmount: commission.toFixed(), treatment: p.commissionTreatment || "capitalized_cost", label: "commission", feeCurrency: currency },
      { feeAmount: tax.toFixed(), treatment: p.taxTreatment || "capitalized_cost", label: "tax", feeCurrency: currency },
      { feeAmount: other.toFixed(), treatment: p.otherFeeTreatment || "capitalized_cost", label: "otherFee", feeCurrency: currency },
    ].filter((f) => !toDecimal(f.feeAmount).isZero()),
    { baseCurrency, transactionCurrency: currency, exchangeRateToBase: "1" },
  );
  // P0-03 T+n: trade credits broker payable; cash only on settlement leg
  const payableId =
    p.brokerPayableAccountId ||
    scopedAccountId(`broker_payable_${p.brokerageId}`, currency);
  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", currency);
  const invId = scopedAccountId("stock_inventory", currency);

  // Fee expense credits payable (not cash) until settlement
  const feeResult = applyFeeEvents(feeEvents, {
    expenseAccountId: scopedAccountId("stock_fee_expense", baseCurrency),
    cashAccountId: payableId,
  });
  const carrying = gross.plus(toDecimal(feeResult.carryingDeltaBase));
  const totalDue = gross.plus(commission).plus(tax).plus(other);
  const tradeDate = p.tradeDate;
  let settlementDate = p.settlementDate || null;
  let settlementPolicyVersion = p.settlementPolicyVersion || null;
  if (!settlementDate && p.autoSettlementDate !== false) {
    const computed = computeEquitySettlementDate(tradeDate, {
      tPlus: p.tPlus != null ? Number(p.tPlus) : 2,
      policyVersion: p.settlementPolicyVersion || SETTLEMENT_POLICY_VERSION,
    });
    settlementDate = computed.settlementDate;
    settlementPolicyVersion = computed.policyVersion;
  }
  if (settlementDate && settlementDate < tradeDate) {
    throw new Error("SETTLEMENT_BEFORE_TRADE");
  }
  if (settlementDate === tradeDate && p.allowSameDaySettlement !== true) {
    throw new Error("SETTLEMENT_SAME_DAY_REQUIRES_POLICY");
  }

  const settleSameOp =
    settlementDate != null &&
    settlementDate === tradeDate &&
    p.allowSameDaySettlement === true;

  const now = new Date().toISOString();
  const holdingId = randomUUID();
  const txId = randomUUID();

  // Trade leg (T+0 position): Dr Stock / Cr Broker Payable
  const expensePayable = feeResult.journalLines
    .filter((l) => l.side === "credit")
    .reduce((s, l) => s.plus(toDecimal(l.amount)), toDecimal("0"));
  const payablePrincipal = totalDue.minus(expensePayable);

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
    {
      accountId: payableId,
      side: "credit",
      amount: payablePrincipal.toFixed(),
      currency,
      amountInBase: payablePrincipal.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    ...feeResult.journalLines,
  ];

  // Settlement leg only when policy allows same-day T+0 cash
  if (settleSameOp) {
    journalLines.push(
      {
        accountId: payableId,
        side: "debit",
        amount: totalDue.toFixed(),
        currency,
        amountInBase: totalDue.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "principal",
      },
      {
        accountId: cashId,
        side: "credit",
        amount: totalDue.toFixed(),
        currency,
        amountInBase: totalDue.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "principal",
      },
    );
  }

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "stocks.buy",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: {
      ...p,
      gross: gross.toFixed(),
      carrying: carrying.toFixed(),
      totalDue: totalDue.toFixed(),
    },
    journalLines,
    domainResult: {
      fees: feeResult.derivedFeeBases,
      holdingId,
      transactionId: txId,
      carrying: carrying.toFixed(),
      totalDue: totalDue.toFixed(),
      settlementStatus: settleSameOp ? "settled_same_op" : "pending_settlement",
      brokerPayableAccountId: payableId,
      tradeDate,
      settlementDate,
      expectedSettlementDate: p.expectedSettlementDate || settlementDate,
      settlementPolicyVersion: settlementPolicyVersion || p.settlementPolicyVersion || null,
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
      ensureAccount(db, {
        id: payableId,
        name: `Broker payable ${p.brokerageId} (${currency})`,
        accountKind: "liability",
        currency,
        systemRole: "broker_payable",
      });
      if (feeResult.journalLines.some((l) => l.lineKind === "fee")) {
        ensureAccount(db, {
          id: scopedAccountId("stock_fee_expense", baseCurrency),
          name: `Stock fee expense (${baseCurrency})`,
          accountKind: "expense",
          currency: baseCurrency,
          systemRole: "stock_fee_expense",
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
