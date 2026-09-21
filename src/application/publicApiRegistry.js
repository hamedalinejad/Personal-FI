<<<<<<< HEAD
import { createBook, getBook } from "../features/meta/commands/createBook.js";
/**
 * Public API command + query registry.
 */

import { deposit } from "../features/accounts/commands/deposit.js";
import { createAccount } from "../features/accounts/commands/createAccount.js";
import { withdraw } from "../features/accounts/commands/withdraw.js";
import { transfer } from "../features/accounts/commands/transfer.js";
import { createIncome } from "../features/income/commands/create.js";
import { createExpense } from "../features/expense/commands/create.js";
import { createLoan } from "../features/loan/commands/createLoan.js";
import { recordPayment } from "../features/loan/commands/recordPayment.js";
import { queryPresentationBalance } from "../core/accounting/reports/presentationBalance.js";
import { trialBalance, netWorth } from "../core/accounting/reports/statements.js";
import { queryAll, queryOne, getMeta } from "../core/persistence/browser/browserSqlAdapter.js";
import { computeMoneyTotals } from "./reporting/moneyTotals.js";
import { buyCrypto } from "../features/crypto/commands/buy.js";
import { buyMetals } from "../features/metals/commands/buy.js";
import { adjustTax } from "../features/tax/commands/adjust.js";
import { bounceCheque } from "../features/cheque/commands/bounce.js";
import {
  createBatch as importCreateBatch,
  ingestRaw as importIngestRaw,
  normalizeBatch as importNormalizeBatch,
  mapBatch as importMapBatch,
  validateBatch as importValidateBatch,
  commitBatch as importCommitBatch,
  getBatch as importGetBatch,
} from "../features/import/public-api/index.js";
import { buildCommandHandlers } from "./commandRegistry.js";

export const commandHandlers = {
  "book.create": createBook,
  "accounts.create": createAccount,
  "accounts.deposit": deposit,
  "accounts.withdraw": withdraw,
  "accounts.transfer": transfer,
  "income.create": createIncome,
  "expense.create": createExpense,
  "loan.create": createLoan,
  "loan.recordPayment": recordPayment,
  "crypto.buy": buyCrypto,
  "metals.buy": buyMetals,
  "tax.adjust": adjustTax,
  "cheque.bounce": bounceCheque,
  "import.createBatch": importCreateBatch,
  "import.ingestRaw": importIngestRaw,
  "import.normalizeBatch": importNormalizeBatch,
  "import.mapBatch": importMapBatch,
  "import.validateBatch": importValidateBatch,
  "import.commitBatch": importCommitBatch,
  "import.getBatch": importGetBatch,
};

export const queryHandlers = {
  "accounts.list": async ({ db }) => {
    const rows = queryAll(
      db,
      `SELECT id, code, name, account_kind, currency, is_archived, created_at, updated_at
       FROM fin_accounts WHERE is_archived = 0 ORDER BY name`
    );
    const accounts = rows.map((r) => ({
      ...r,
      presentationBalance: queryPresentationBalance(db, r.id, r.account_kind),
    }));
    return { accounts, rows: accounts };
  },
  "accounts.get": async ({ db, params }) => {
    const r = queryOne(db, `SELECT * FROM fin_accounts WHERE id = ?`, [params.accountId]);
    if (!r) return null;
    return {
      ...r,
      presentationBalance: queryPresentationBalance(db, r.id, r.account_kind),
    };
  },
  "loans.list": async ({ db }) => {
    try {
      const rows = queryAll(db, "SELECT id, role, principal, currency, status, interest_rate FROM ln_loans");
      return { loans: rows };
    } catch {
      return { loans: [] };
    }
  },
  "operations.list": async ({ db, params }) => {
    const limit = Math.min(Number(params?.limit) || 50, 200);
    try {
      const rows = queryAll(
        db,
        `SELECT id, operation_type, status, business_date, created_at FROM fin_operations
         ORDER BY created_at DESC LIMIT ?`,
        [limit]
      );
      return { operations: rows };
    } catch {
      return { operations: [] };
    }
  },
  "money.totals": async ({ db, params }) => {
    const fxMap = new Map();
    if (params?.fxRates && typeof params.fxRates === "object") {
      for (const [k, v] of Object.entries(params.fxRates)) fxMap.set(k, String(v));
    }
    return computeMoneyTotals(db, {
      reportCurrency: params?.reportCurrency || null,
      fxToReport: fxMap,
    });
  },
  "accounts.options": async ({ db }) => {
    return queryAll(
      db,
      `SELECT id, name, currency, account_kind FROM fin_accounts WHERE is_archived = 0 ORDER BY name`
    );
  },
  "reports.trialBalance": async ({ db, params }) => trialBalance(db, { asOf: params?.asOf }),
  "reports.netWorth": async ({ db, params }) => netWorth(db, { asOf: params?.asOf }),
  "book.get": async ({ db }) => (await getBook({ db })).data,
  "meta.book": async ({ db }) => ({
    id: getMeta(db, "book_id"),
    bookId: getMeta(db, "book_id"),
    name: getMeta(db, "book_name") || "Personal Book",
    baseCurrency: getMeta(db, "book_base_currency"),
    createdAt: getMeta(db, "book_created_at"),
    schemaVersion: getMeta(db, "schemaVersion"),
  }),
};

export function getCommandHandler(id) {
  return commandHandlers[id] || null;
}

export function getQueryHandler(id) {
  return queryHandlers[id] || null;
}
=======
/**
 * Full application surface composition.
 * UI hosts import ONLY this registry (or feature public-api barrels).
 * License SoT: docs/core/registry/license-editions.json via capabilityGate.
 */
import * as accounts from "../features/accounts/public-api/index.js";
import * as income from "../features/income/public-api/index.js";
import * as expense from "../features/expense/public-api/index.js";
import * as cheque from "../features/cheque/public-api/index.js";
import * as tax from "../features/tax/public-api/index.js";
import * as assets from "../features/assets/public-api/index.js";
import * as budget from "../features/budget/public-api/index.js";
import * as goals from "../features/goals/public-api/index.js";
import * as bills from "../features/bills/public-api/index.js";
import * as loan from "../features/loan/public-api/index.js";
import * as crypto from "../features/crypto/public-api/index.js";
import * as stocks from "../features/stocks/public-api/index.js";
import * as funds from "../features/funds/public-api/index.js";
import * as metals from "../features/metals/public-api/index.js";
import { reportPack } from "./reporting/reportPack.js";
import { nodeOfflineHarness } from "../platform/node/offlineHarness.js";
import {
  assertCommandAllowed,
  isCommandAllowed,
  listEditions,
  downgradeEdition,
  capabilitiesForEdition,
} from "../core/license/capabilityGate.js";

export const modules = Object.freeze({
  accounts,
  income,
  expense,
  cheque,
  tax,
  assets,
  budget,
  goals,
  bills,
  loan,
  crypto,
  stocks,
  funds,
  metals,
});

export const applicationApi = Object.freeze({
  ...modules,
  reports: { reportPack },
  offline: nodeOfflineHarness,
  license: {
    listEditions,
    isCommandAllowed,
    assertCommandAllowed,
    downgradeEdition,
  },
});

export const APPLICATION_MODULE_KEYS = Object.freeze(Object.keys(modules));

export function toCommandId(moduleName, methodName) {
  if (moduleName === "goals" && methodName === "create") return "goal.create";
  if (moduleName === "bills" && methodName === "schedule") return "bill.schedule";
  return `${moduleName}.${methodName}`;
}

function editionAllows(editionId, commandId) {
  const caps = capabilitiesForEdition(editionId);
  if (caps.includes("*")) return true;
  if (caps.includes(commandId)) return true;
  return caps.some((c) => c.endsWith(".*") && commandId.startsWith(c.slice(0, -1)));
}

export async function gatedCommand(editionId, moduleName, methodName, ...args) {
  const commandId = toCommandId(moduleName, methodName);
  if (!editionAllows(editionId, commandId)) {
    // Host modules (accounts, income, …) are full-edition only unless capability * 
    const err = new Error("LICENSE_REQUIRED");
    err.code = "LICENSE_REQUIRED";
    err.commandId = commandId;
    err.editionId = editionId;
    throw err;
  }
  const mod = modules[moduleName];
  if (!mod || typeof mod[methodName] !== "function") {
    throw new Error(`COMMAND_NOT_FOUND:${moduleName}.${methodName}`);
  }
  return mod[methodName](...args);
}
>>>>>>> origin/main
