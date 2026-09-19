/**
 * Phase 10/11 — UI talks only to feature public-api / reportPack.
 * Never imports feature internals, SQL, or journal writers.
 */
import * as accounts from "../features/accounts/public-api/index.js";
import * as income from "../features/income/public-api/index.js";
import * as expense from "../features/expense/public-api/index.js";
import * as loan from "../features/loan/public-api/index.js";
import * as crypto from "../features/crypto/public-api/index.js";
import * as budget from "../features/budget/public-api/index.js";
import { reportPack } from "../core/accounting/reports/index.js";
import {
  backupDatabase,
  restoreDatabase,
  openDb,
  closeAllDbs,
} from "../core/persistence/browser/sqlJsIndexedDbAdapter.js";

export const api = {
  accounts,
  income,
  expense,
  loan,
  crypto,
  budget,
  reports: { reportPack },
  offline: { backupDatabase, restoreDatabase, openDb, closeAllDbs },
};

/** Forbidden import patterns for UI modules (checked by test) */
export const UI_FORBIDDEN_IMPORT_SUBSTR = Object.freeze([
  "features/*/commands",
  "features/*/ledger",
  "fin_journal",
  "node:sqlite",
  "schema.sql",
]);
