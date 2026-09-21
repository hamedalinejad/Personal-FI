/**
 * Single machine registry for command/query boundaries (BUG-P1-16).
 * publicApi, host, capabilityGate, UI action lists, docs generators all read this.
 *
 * kind: command | query
 * capability: used by license gate
 */

import { deposit } from "../features/accounts/commands/deposit.js";
import { createAccount } from "../features/accounts/commands/createAccount.js";
import { withdraw } from "../features/accounts/commands/withdraw.js";
import { transfer } from "../features/accounts/commands/transfer.js";
import { createIncome } from "../features/income/commands/create.js";
import { createExpense } from "../features/expense/commands/create.js";
import { createLoan } from "../features/loan/commands/createLoan.js";
import { recordPayment } from "../features/loan/commands/recordPayment.js";
import { buyCrypto } from "../features/crypto/commands/buy.js";
import { buyMetals } from "../features/metals/commands/buy.js";
import { adjustTax } from "../features/tax/commands/adjust.js";
import { bounceCheque } from "../features/cheque/commands/bounce.js";
import { createBook, getBook } from "../features/meta/commands/createBook.js";
import { clearCheque } from "../features/cheque/commands/clear.js";
import {
  createBatch as importCreateBatch,
  ingestRaw as importIngestRaw,
  normalizeBatch as importNormalizeBatch,
  mapBatch as importMapBatch,
  validateBatch as importValidateBatch,
  commitBatch as importCommitBatch,
  getBatch as importGetBatch,
} from "../features/import/public-api/index.js";

/** @type {Record<string, { kind: "command"|"query", module: string, capability: string, handler?: Function, idempotent?: boolean }>} */
export const COMMAND_REGISTRY = Object.freeze({
  // Accounts
  "book.create": { kind: "command", module: "meta", capability: "meta.*", handler: createBook, idempotent: true },
  "book.get": { kind: "query", module: "meta", capability: "meta.*" },
  "accounts.create": { kind: "command", module: "accounts", capability: "accounts.*", handler: createAccount, idempotent: true },
  "accounts.deposit": { kind: "command", module: "accounts", capability: "accounts.*", handler: deposit, idempotent: true },
  "accounts.withdraw": { kind: "command", module: "accounts", capability: "accounts.*", handler: withdraw, idempotent: true },
  "accounts.transfer": { kind: "command", module: "accounts", capability: "accounts.*", handler: transfer, idempotent: true },

  // Income / expense
  "income.create": { kind: "command", module: "income", capability: "income.*", handler: createIncome, idempotent: true },
  "expense.create": { kind: "command", module: "expense", capability: "expense.*", handler: createExpense, idempotent: true },

  // Loan
  "loan.create": { kind: "command", module: "loan", capability: "loan.*", handler: createLoan, idempotent: true },
  "loan.recordPayment": { kind: "command", module: "loan", capability: "loan.*", handler: recordPayment, idempotent: true },

  // Investments
  "crypto.buy": { kind: "command", module: "crypto", capability: "crypto.*", handler: buyCrypto, idempotent: true },
  "metals.buy": { kind: "command", module: "metals", capability: "metals.*", handler: buyMetals, idempotent: true },

  // Tax / cheque
  "tax.adjust": { kind: "command", module: "tax", capability: "tax.*", handler: adjustTax, idempotent: true },
  "cheque.bounce": { kind: "command", module: "cheque", capability: "cheque.*", handler: bounceCheque, idempotent: true },
  "cheque.clear": { kind: "command", module: "cheque", capability: "cheque.*", handler: clearCheque, idempotent: true },

  // Import (R-M22) — commitBatch intentionally rejects until mapping complete
  "import.createBatch": { kind: "command", module: "import", capability: "import.*", handler: importCreateBatch, idempotent: true },
  "import.ingestRaw": { kind: "command", module: "import", capability: "import.*", handler: importIngestRaw, idempotent: false },
  "import.normalizeBatch": { kind: "command", module: "import", capability: "import.*", handler: importNormalizeBatch, idempotent: true },
  "import.mapBatch": { kind: "command", module: "import", capability: "import.*", handler: importMapBatch, idempotent: true },
  "import.validateBatch": { kind: "command", module: "import", capability: "import.*", handler: importValidateBatch, idempotent: true },
  "import.commitBatch": { kind: "command", module: "import", capability: "import.*", handler: importCommitBatch, idempotent: true },
  "import.getBatch": { kind: "command", module: "import", capability: "import.*", handler: importGetBatch, idempotent: true },

  // Queries
  "accounts.list": { kind: "query", module: "accounts", capability: "accounts.*" },
  "accounts.get": { kind: "query", module: "accounts", capability: "accounts.*" },
  "accounts.options": { kind: "query", module: "accounts", capability: "accounts.*" },
  "money.totals": { kind: "query", module: "accounts", capability: "accounts.*" },
  "investments.holdings": { kind: "query", module: "investments", capability: "reports.*" },
  "meta.book": { kind: "query", module: "meta", capability: "meta.*" },
  "meta.license": { kind: "query", module: "meta", capability: "meta.*" },
  "reports.trialBalance": { kind: "query", module: "reports", capability: "reports.*" },
  "reports.balanceSheet": { kind: "query", module: "reports", capability: "reports.*" },
  "reports.incomeStatement": { kind: "query", module: "reports", capability: "reports.*" },
  "reports.cashFlow": { kind: "query", module: "reports", capability: "reports.*" },
  "reports.generalLedger": { kind: "query", module: "reports", capability: "reports.*" },
  "reports.netWorth": { kind: "query", module: "reports", capability: "reports.*" },
  "reports.investmentHoldings": { kind: "query", module: "reports", capability: "reports.*" },
});

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isRegisteredCommand(id) {
  return typeof id === "string" && COMMAND_REGISTRY[id]?.kind === "command";
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isRegisteredQuery(id) {
  return typeof id === "string" && COMMAND_REGISTRY[id]?.kind === "query";
}

/**
 * @param {string} id
 */
export function getRegistryEntry(id) {
  return COMMAND_REGISTRY[id] || null;
}

/**
 * Build commandHandlers map for FinancialHost.
 */
export function buildCommandHandlers() {
  /** @type {Record<string, Function>} */
  const out = {};
  for (const [id, entry] of Object.entries(COMMAND_REGISTRY)) {
    if (entry.kind === "command" && entry.handler) out[id] = entry.handler;
  }
  return out;
}

/**
 * Capability id for a command (for license gate).
 * @param {string} id
 */
export function capabilityFor(id) {
  return COMMAND_REGISTRY[id]?.capability || id;
}
