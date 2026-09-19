import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { openDb } from "../../../core/persistence/port.js";
import { ensureAccount, scopedAccountId, assertAccountUsable } from "../../../core/accounting/chartOfAccounts.js";
import { requireOperationId, requirePayload, requirePositiveMoney, requireDate, requireCurrency } from "../../_shared/commandGuard.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/** assets.dispose — with explicit proceeds through Core */
export async function disposeAsset(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  if (!p.assetId) throw new Error("VALIDATION_ERROR:assetId");
  if (!p.accountId) throw new Error("VALIDATION_ERROR:accountId");
  const proceeds = requirePositiveMoney(p.proceeds);
  const currency = requireCurrency(p.currency);
  const businessDate = requireDate(p.businessDate);
  const db = openDb(dataDir);
  const asset = db.prepare(`SELECT * FROM pa_assets WHERE id = ?`).get(p.assetId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");
  if (asset.is_disposed === 1) throw new Error("ASSET_DISPOSED");
  const acc = db.prepare(`SELECT * FROM acc_accounts WHERE id = ?`).get(p.accountId);
  if (!acc) throw new Error("ACCOUNT_NOT_FOUND");
  assertAccountUsable(db, acc.fin_account_id, currency);

  const cost = toDecimal(asset.acquisition_cost || "0");
  const gainId = scopedAccountId("asset_disposal_gain", currency);
  const lossId = scopedAccountId("asset_disposal_loss", currency);
  const inventoryId = scopedAccountId("physical_asset_inventory", currency);
  const amt = proceeds.toFixed();
  const costStr = cost.toFixed();
  const now = new Date().toISOString();

  // Dr cash proceeds; Cr inventory cost; residual to gain/loss
  const journalLines = [
    { accountId: acc.fin_account_id, side: "debit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
  ];
  if (cost.gt(0)) {
    journalLines.push({
      accountId: inventoryId,
      side: "credit",
      amount: costStr,
      currency,
      amountInBase: costStr,
      exchangeRateToBase: "1",
      lineKind: "other",
    });
  }
  const diff = proceeds.minus(cost);
  if (diff.gt(0)) {
    journalLines.push({
      accountId: gainId,
      side: "credit",
      amount: diff.toFixed(),
      currency,
      amountInBase: diff.toFixed(),
      exchangeRateToBase: "1",
      lineKind: "other",
    });
  } else if (diff.lt(0)) {
    journalLines.push({
      accountId: lossId,
      side: "debit",
      amount: diff.abs().toFixed(),
      currency,
      amountInBase: diff.abs().toFixed(),
      exchangeRateToBase: "1",
      lineKind: "other",
    });
  }

  const paTxId = randomUUID();
  return runAtomicFinancialOperation({
    operationId,
    type: "assets.dispose",
    dataDir,
    businessDate,
    baseCurrency: currency,
    status: "posted",
    payload: p,
    journalLines,
    withinTransaction(db) {
      ensureAccount(db, { id: inventoryId, name: `Physical assets (${currency})`, accountKind: "asset", currency, systemRole: "physical_asset_inventory" });
      ensureAccount(db, { id: gainId, name: `Asset disposal gain (${currency})`, accountKind: "income", currency, systemRole: "asset_disposal_gain" });
      ensureAccount(db, { id: lossId, name: `Asset disposal loss (${currency})`, accountKind: "expense", currency, systemRole: "asset_disposal_loss" });
      db.prepare(`UPDATE pa_assets SET is_disposed = 1, updated_at = ? WHERE id = ?`).run(now, p.assetId);
      db.prepare(
        `INSERT INTO pa_transactions (id, asset_id, operation_id, tx_type, business_date, amount, currency, created_at)
         VALUES (?, ?, ?, 'disposal', ?, ?, ?, ?)`,
      ).run(paTxId, p.assetId, operationId, businessDate, amt, currency, now);
    },
  });
}
