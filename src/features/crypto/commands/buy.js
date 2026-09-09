import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import {
  ensureLocalSettlementAccounts,
  ensureFeatureInventoryAccount,
  scopedAccountId,
} from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { openDb } from "../../../core/persistence/port.js";

/**
 * crypto.buy — all master mutations inside the financial transaction.
 * Multi-currency: amountInBase = cost × exchangeRateToBase when costCurrency !== base.
 */
export async function buyCrypto(input, { dataDir } = {}) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;

  for (const k of [
    "instrumentId",
    "grossQuantity",
    "netQuantity",
    "costTotal",
    "costCurrency",
    "businessDate",
    "currency",
    "feeRole",
    "price",
    "priceAsOf",
    "exchangeId",
  ]) {
    if (p[k] == null || p[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }

  const baseCurrency = p.currency;
  const costCurrency = p.costCurrency;
  const gross = toDecimal(p.grossQuantity);
  const fee = toDecimal(p.feeQuantity || "0");
  const net = toDecimal(p.netQuantity);
  if (p.feeRole === "fee_from_received" || p.feeRole === "feeBurnQuantity") {
    if (!gross.minus(fee).eq(net)) throw new Error("INV_QTY_CONSERVATION");
  }

  const cost = toDecimal(p.costTotal);
  let exchangeRateToBase = p.exchangeRateToBase != null ? toDecimal(p.exchangeRateToBase) : null;
  if (costCurrency === baseCurrency) {
    exchangeRateToBase = toDecimal("1");
  } else if (exchangeRateToBase == null) {
    throw new Error("VALIDATION_ERROR:exchangeRateToBase");
  }
  const amountInBase = cost.times(exchangeRateToBase);

  // Resolve fee treatment (default: fee_from_received reduces quantity, not cash cost)
  const feeTreatment = p.feeTreatment || "fee_from_received";
  let carryingCost = amountInBase;
  if (feeTreatment === "capitalized_cost" && p.feeAmountBase) {
    carryingCost = amountInBase.plus(toDecimal(p.feeAmountBase));
  }

  const cashId = p.cashAccountId || scopedAccountId("local_settlement_cash", costCurrency);
  const invId = scopedAccountId("crypto_inventory", baseCurrency);
  const networkId = p.networkId || p.network_identifier || null;
  const contractAddress = p.contractAddress || p.contract_address || null;

  const journalLines = [
    {
      accountId: invId,
      side: "debit",
      amount: cost.toFixed(),
      currency: costCurrency,
      amountInBase: amountInBase.toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
    {
      accountId: cashId,
      side: "credit",
      amount: cost.toFixed(),
      currency: costCurrency,
      amountInBase: amountInBase.toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      lineKind: "principal",
    },
  ];

  const holdingId = randomUUID();
  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    operationId,
    type: "crypto.buy",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency,
    payload: {
      ...p,
      networkId,
      contractAddress,
      amountInBase: amountInBase.toFixed(),
      exchangeRateToBase: exchangeRateToBase.toFixed(),
      feeTreatment,
      carryingCost: carryingCost.toFixed(),
    },
    journalLines,
    domainResult: {
      holdingId,
      transactionId: txId,
      netQuantity: net.toFixed(),
      carryingCost: carryingCost.toFixed(),
      networkId,
    },
    engineVersions: { crypto: "1.1.0", money: "1.0.0" },
    withinTransaction(db) {
      ensureLocalSettlementAccounts(db, costCurrency);
      ensureFeatureInventoryAccount(db, {
        featureKey: "crypto",
        currency: baseCurrency,
        displayName: "Crypto investment",
      });

      db.prepare(
        `INSERT OR IGNORE INTO inv_crypto_exchanges (id, name, created_at) VALUES (?, ?, ?)`,
      ).run(p.exchangeId, p.exchangeName || p.exchangeId, now);

      const existingInst = db
        .prepare(`SELECT id, network_identifier, contract_address, asset_class FROM ref_instruments WHERE id = ?`)
        .get(p.instrumentId);
      if (existingInst) {
        if (existingInst.asset_class !== "crypto") throw new Error("INSTRUMENT_ASSET_CLASS_MISMATCH");
        if (networkId && existingInst.network_identifier && existingInst.network_identifier !== networkId) {
          throw new Error("CRYPTO_NETWORK_MISMATCH");
        }
        if (contractAddress && existingInst.contract_address && existingInst.contract_address !== contractAddress) {
          throw new Error("CRYPTO_CONTRACT_MISMATCH");
        }
      } else {
        db.prepare(
          `INSERT INTO ref_instruments (
            id, asset_class, symbol, name, network_identifier, contract_address,
            created_at, updated_at, is_active
          ) VALUES (?, 'crypto', ?, ?, ?, ?, ?, ?, 1)`,
        ).run(
          p.instrumentId,
          p.symbol || "ASSET",
          p.name || p.symbol || "ASSET",
          networkId,
          contractAddress,
          now,
          now,
        );
      }

      // Holding scoped by exchange + instrument + network
      let holding;
      if (networkId) {
        holding = db
          .prepare(
            `SELECT * FROM inv_crypto_holdings
             WHERE instrument_id = ? AND exchange_id = ? AND network_id = ?`,
          )
          .get(p.instrumentId, p.exchangeId, networkId);
      } else {
        holding = db
          .prepare(
            `SELECT * FROM inv_crypto_holdings
             WHERE instrument_id = ? AND exchange_id = ? AND network_id IS NULL`,
          )
          .get(p.instrumentId, p.exchangeId);
      }

      const qty = net.toFixed();
      if (holding) {
        const newQty = toDecimal(holding.quantity).plus(net);
        const newCost = toDecimal(holding.total_invested || "0").plus(carryingCost);
        db.prepare(
          `UPDATE inv_crypto_holdings SET quantity = ?, total_invested = ?, updated_at = ? WHERE id = ?`,
        ).run(newQty.toFixed(), newCost.toFixed(), now, holding.id);
        holding = { ...holding, id: holding.id };
      } else {
        db.prepare(
          `INSERT INTO inv_crypto_holdings (
            id, exchange_id, network_id, instrument_id, quantity, total_invested, cost_currency, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          holdingId,
          p.exchangeId,
          networkId,
          p.instrumentId,
          qty,
          carryingCost.toFixed(),
          costCurrency,
          now,
          now,
        );
        holding = { id: holdingId };
      }

      db.prepare(
        `INSERT INTO inv_crypto_transactions (
          id, operation_id, holding_id, instrument_id,
          tx_type, business_date, gross_quantity, fee_quantity, net_quantity,
          fee_currency, fee_instrument_id, economic_kind, created_at
        ) VALUES (?, ?, ?, ?, 'buy', ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        operationId,
        holding.id,
        p.instrumentId,
        p.businessDate,
        gross.toFixed(),
        fee.toFixed(),
        net.toFixed(),
        p.feeCurrency || costCurrency,
        p.feeInstrumentId || null,
        "acquisition",
        now,
      );
    },
  });
}
