import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  ensureAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { applyTransfer } from "../../../core/domain/costBasis/engine.js";
import { openDb } from "../../../core/persistence/port.js";

function loadHolding(db, instrumentId, exchangeId, networkId) {
  if (networkId) {
    return db
      .prepare(
        `SELECT * FROM inv_crypto_holdings WHERE instrument_id=? AND exchange_id=? AND network_id=?`,
      )
      .get(instrumentId, exchangeId, networkId);
  }
  return db
    .prepare(
      `SELECT * FROM inv_crypto_holdings WHERE instrument_id=? AND exchange_id=? AND network_id IS NULL`,
    )
    .get(instrumentId, exchangeId);
}

/**
 * crypto.transfer — custody move; realized PnL = 0; cost follows net quantity.
 */
export async function transferCrypto(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of [
    "instrumentId",
    "fromExchangeId",
    "toExchangeId",
    "grossQuantity",
    "netQuantity",
    "businessDate",
  ]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }
  if (p.fromExchangeId === p.toExchangeId) throw new Error("TRANSFER_SAME_EXCHANGE");

  const gross = toDecimal(p.grossQuantity);
  const feeQty = toDecimal(p.feeQuantity || "0");
  const net = toDecimal(p.netQuantity);
  if (!gross.eq(net.plus(feeQty))) throw new Error("TRANSFER_GROSS_NET_FEE_MISMATCH");

  const networkId = p.networkId || null;
  const db0 = openDb(dataDir);
  const fromH = loadHolding(db0, p.instrumentId, p.fromExchangeId, networkId);
  if (!fromH) throw new Error("HOLDING_NOT_FOUND");
  const costCurrency = fromH.cost_currency;
  const unit = toDecimal(fromH.total_invested).div(toDecimal(fromH.quantity));
  const toH = loadHolding(db0, p.instrumentId, p.toExchangeId, networkId);

  const result = applyTransfer(
    { quantity: fromH.quantity, totalInvested: fromH.total_invested },
    toH
      ? { quantity: toH.quantity, totalInvested: toH.total_invested }
      : { quantity: "0", totalInvested: "0" },
    {
      grossQuantity: gross.toFixed(),
      feeQuantity: feeQty.toFixed(),
      netQuantity: net.toFixed(),
      sourceUnitCost: unit.toFixed(),
    },
  );

  const invId = scopedAccountId("crypto_inventory", costCurrency);
  const feeExp = scopedAccountId("crypto_transfer_fee", costCurrency);
  const clearing = scopedAccountId("crypto_transfer_clearing", costCurrency);
  const journalLines = [];
  const feeCarry = toDecimal(result.transfer.feeCarrying);
  const destCarry = toDecimal(result.transfer.destinationCarrying);

  if (feeCarry.gt(0)) {
    journalLines.push(
      {
        accountId: feeExp,
        side: "debit",
        amount: feeCarry.toFixed(),
        currency: costCurrency,
        amountInBase: feeCarry.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "fee",
      },
      {
        accountId: invId,
        side: "credit",
        amount: feeCarry.toFixed(),
        currency: costCurrency,
        amountInBase: feeCarry.toFixed(),
        exchangeRateToBase: "1",
        lineKind: "fee",
      },
    );
  }

  // Cost-neutral custody legs (net carrying through clearing)
  journalLines.push(
    {
      accountId: invId,
      side: "credit",
      amount: destCarry.toFixed(),
      currency: costCurrency,
      amountInBase: destCarry.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: clearing,
      side: "debit",
      amount: destCarry.toFixed(),
      currency: costCurrency,
      amountInBase: destCarry.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: clearing,
      side: "credit",
      amount: destCarry.toFixed(),
      currency: costCurrency,
      amountInBase: destCarry.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
    {
      accountId: invId,
      side: "debit",
      amount: destCarry.toFixed(),
      currency: costCurrency,
      amountInBase: destCarry.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "principal",
    },
  );

  const txOut = randomUUID();
  const txIn = randomUUID();
  const toHoldingId = toH?.id || randomUUID();
  const now = new Date().toISOString();
  const baseCurrency = p.currency || costCurrency;

  return runAtomicFinancialOperation({
    operationId,
    type: "crypto.transfer",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency,
    payload: p,
    journalLines,
    domainResult: {
      fromHoldingId: fromH.id,
      toHoldingId,
      transfer: result.transfer,
      fromAfter: result.from,
      toAfter: result.to,
    },
    engineVersions: { crypto: "1.3.0", costBasis: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, costCurrency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "crypto",
        currency: costCurrency,
        displayName: "Crypto investment",
      });
      ensureAccount(db, {
        id: clearing,
        name: `Crypto transfer clearing (${costCurrency})`,
        accountKind: "asset",
        currency: costCurrency,
        systemRole: "crypto_transfer_clearing",
      });
      if (feeCarry.gt(0)) {
        ensureAccount(db, {
          id: feeExp,
          name: `Crypto transfer fee (${costCurrency})`,
          accountKind: "expense",
          currency: costCurrency,
          systemRole: "crypto_transfer_fee",
        });
      }

      const from2 = loadHolding(db, p.instrumentId, p.fromExchangeId, networkId);
      if (!from2) throw new Error("HOLDING_NOT_FOUND");
      const to2 = loadHolding(db, p.instrumentId, p.toExchangeId, networkId);
      const unit2 = toDecimal(from2.total_invested).div(toDecimal(from2.quantity));
      const r2 = applyTransfer(
        { quantity: from2.quantity, totalInvested: from2.total_invested },
        to2
          ? { quantity: to2.quantity, totalInvested: to2.total_invested }
          : { quantity: "0", totalInvested: "0" },
        {
          grossQuantity: gross.toFixed(),
          feeQuantity: feeQty.toFixed(),
          netQuantity: net.toFixed(),
          sourceUnitCost: unit2.toFixed(),
        },
      );

      db.prepare(
        `UPDATE inv_crypto_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
      ).run(r2.from.quantity, r2.from.totalInvested, now, from2.id);

      if (to2) {
        db.prepare(
          `UPDATE inv_crypto_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
        ).run(r2.to.quantity, r2.to.totalInvested, now, to2.id);
      } else {
        db.prepare(
          `INSERT INTO inv_crypto_holdings (
            id, exchange_id, network_id, instrument_id, quantity, total_invested, cost_currency, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          toHoldingId,
          p.toExchangeId,
          networkId,
          p.instrumentId,
          r2.to.quantity,
          r2.to.totalInvested,
          costCurrency,
          now,
          now,
        );
      }

      const ins = `INSERT INTO inv_crypto_transactions (
        id, operation_id, holding_id, instrument_id,
        tx_type, business_date, gross_quantity, fee_quantity, net_quantity,
        fee_currency, fee_instrument_id, economic_kind, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      db.prepare(ins).run(
        txOut,
        operationId,
        from2.id,
        p.instrumentId,
        "transfer_out",
        p.businessDate,
        gross.toFixed(),
        feeQty.toFixed(),
        net.toFixed(),
        costCurrency,
        null,
        "transfer",
        now,
      );
      db.prepare(ins).run(
        txIn,
        operationId,
        to2 ? to2.id : toHoldingId,
        p.instrumentId,
        "transfer_in",
        p.businessDate,
        net.toFixed(),
        "0",
        net.toFixed(),
        costCurrency,
        null,
        "transfer",
        now,
      );
    },
  });
}
