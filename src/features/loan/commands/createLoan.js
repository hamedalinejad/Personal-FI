import { resolveBookBaseCurrency, requireFxIfCrossCurrency } from "../../../core/accounting/bookSettings.js";
import { randomUUID } from "node:crypto";
import { generateSchedule } from "../domain/scheduleFacade.js";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts, scopedAccountId, ensureLocalSettlementAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { localSettlementAdapter } from "../adapters/localSettlementAdapter.js";
import { buildScheduleSnapshot } from "../domain/scheduleSnapshot.js";
import { normalizeLoanRole } from "../domain/role.js";
import { normalizeRatePercentage } from "../../../core/domain/loan/scheduleEngine.js";

/** Integer period count only (not a money amount). */
function parsePeriods(v) {
  if (v == null || v === "") throw new Error("VALIDATION_ERROR:periods");
  const s = String(v).trim();
  if (!/^[0-9]+$/.test(s)) throw new Error("VALIDATION_ERROR:periods");
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n <= 0 || String(n) !== s) throw new Error("VALIDATION_ERROR:periods");
  return n;
}

/**
 * loan.create — no silent defaults; all domain writes inside one SQLite txn.
 */
export async function createLoan(
  input,
  {
    dataDir,
    cashAccountId = null,
    receivableAccountId = null,
    operationBaseCurrency,
  } = {},
) {
  if (!input || typeof input !== "object") throw new Error("VALIDATION_ERROR");
  if (!input.operationId || typeof input.operationId !== "string") {
    throw new Error("OP_OPERATION_ID_REQUIRED");
  }
  const operationId = input.operationId;
  const p = input.payload || input;

  const role = normalizeLoanRole(p.role);
  // v1 only lender (receivable). Borrower liability path deferred.
  if (role === "borrower") throw new Error("LOAN_ROLE_DEFERRED");
  if (role !== "lender") throw new Error("LOAN_ROLE_UNSUPPORTED");
  if (!p.principal) throw new Error("LOAN_PRINCIPAL_REQUIRED");
  if (!p.currency) throw new Error("LOAN_CURRENCY_REQUIRED");
  if (p.annualRate == null || p.annualRate === "") throw new Error("LOAN_RATE_REQUIRED");
  if (!p.periods) throw new Error("LOAN_PERIODS_REQUIRED");
  if (!p.method) throw new Error("LOAN_METHOD_REQUIRED");
  const METHOD_ALIASES = { flat: "flat_rate", qarz: "qarz_al_hasaneh" };
  const methodCanon = METHOD_ALIASES[p.method] || p.method;
  if (!["declining_balance", "flat_rate", "qarz_al_hasaneh", "bullet"].includes(methodCanon)) {
    throw new Error("LOAN_METHOD_INVALID");
  }
  if (!p.startDate) throw new Error("LOAN_START_DATE_REQUIRED");
  if (!p.businessDate) throw new Error("OP_BUSINESS_DATE_REQUIRED");
  if (!p.dayCount) throw new Error("LOAN_DAY_COUNT_REQUIRED");
  if (p.dayCount !== "period_based") throw new Error("LOAN_DAY_COUNT_UNSUPPORTED");
  // economicMode is legacy alias → originationKind
  const originationKind = p.originationKind || p.economicMode || "disburse_now";
  if (!["disburse_now", "record_outstanding"].includes(originationKind)) {
    throw new Error("LOAN_ORIGINATION_KIND_UNSUPPORTED");
  }
  const FREQ_ALIASES = { month: "monthly", year: "annual", quarter: "quarterly", week: "weekly" };
  const freqRaw = p.installmentFrequency || p.frequency || "monthly";
  const freq = FREQ_ALIASES[freqRaw] || freqRaw;
  if (!["monthly", "weekly", "quarterly", "annual"].includes(freq)) {
    throw new Error("LOAN_FREQUENCY_INVALID");
  }
  if (!["monthly", "weekly", "quarterly", "annual", "yearly"].includes(freq)) {
    throw new Error("LOAN_FREQUENCY_UNSUPPORTED");
  }

  const currency = p.currency;
  const baseCurrency = resolveBookBaseCurrency({ dataDir, explicitBaseCurrency: operationBaseCurrency || p.baseCurrency || null, transactionCurrency: currency });
  if (currency !== baseCurrency) {
    throw new Error("LOAN_MULTI_CURRENCY_DEFERRED");
  }

  const engineVersion = "1.0.0-period_based-equal-principal";
  const rateFractional = normalizeRatePercentage(p.annualRate).toFixed();

  // no DB mutation before atomic op — only stable ids
  if (!cashAccountId) cashAccountId = scopedAccountId("local_settlement_cash", currency);
  if (!receivableAccountId) receivableAccountId = scopedAccountId("loan_receivable", currency);


  const schedule = generateSchedule({
    method: methodCanon,
    principal: p.principal,
    annualRate: p.annualRate,
    periods: p.periods,
    startDate: p.startDate,
    dayCount: p.dayCount,
    feePercent: p.feePercent,
    frequency: freq === "yearly" ? "annual" : freq,
  });

  const snapshot = buildScheduleSnapshot({
    schedule,
    rateInput: p.annualRate,
    rateFractional,
    currency,
    engineVersion,
    frequency: freq === "yearly" ? "annual" : freq,
  });

  const loanId = p.loanId || randomUUID();
  let journalLines;
  if (originationKind === "disburse_now") {
    const settlement = localSettlementAdapter.settle({
      finAccountId: cashAccountId,
      counterAccountId: receivableAccountId,
      amount: p.principal,
      currency,
      side: "credit",
      operationId,
      memo: "loan_disbursement",
    });
    journalLines = settlement.journalLines;
    for (const line of journalLines) {
      line.lineKind = "principal";
      line.amountInBase = line.amount;
      line.exchangeRateToBase = "1";
    }
  } else {
    // record_outstanding: receivable only — DO NOT fabricate cash movement
    // Opening equity/liability offset via opening_balance equity account
    const openingEquityId = scopedAccountId("opening_balances_equity", currency);
    journalLines = [
      {
        accountId: receivableAccountId,
        side: "debit",
        amount: p.principal,
        currency,
        amountInBase: p.principal,
        exchangeRateToBase: "1",
        lineKind: "principal",
      },
      {
        accountId: openingEquityId,
        side: "credit",
        amount: p.principal,
        currency,
        amountInBase: p.principal,
        exchangeRateToBase: "1",
        lineKind: "opening",
      },
    ];
  }

  const snapshotId = randomUUID();
  const now = new Date().toISOString();

  const result = await runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "loan.create",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency,
    payload: { ...p, loanId },
    journalLines,
    domainResult: {
      schedule: snapshot,
      loan: { id: loanId, principal: p.principal, startDate: p.startDate, method: methodCanon },
    },
    engineVersions: { loanSchedule: engineVersion, money: "1.0.0" },
    withinTransaction(db) {
      bootstrapLoanEditionAccounts(dataDir, currency);
      if (originationKind === "record_outstanding") {
        ensureLocalSettlementAccounts(db, currency);
        // opening equity for outstanding-only path
        const eqId = scopedAccountId("opening_balances_equity", currency);
        const existing = db.prepare("SELECT id FROM fin_accounts WHERE id = ?").get(eqId);
        if (!existing) {
          db.prepare(
            `INSERT INTO fin_accounts (id, code, name, account_kind, currency, status, is_archived, created_at)
             VALUES (?, ?, ?, 'equity', ?, 'active', 0, ?)`
          ).run(eqId, eqId, `Opening balances (${currency})`, currency, now);
        }
      }
      db.prepare(
        `INSERT INTO ln_loans (
          id, role, calculation_method, principal, currency, interest_rate, status, created_at,
          start_date, disbursement_date, operation_id, total_installments,
          day_count, day_count_convention, installment_frequency,
          schedule_engine_version, notes, origination_kind, name
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        loanId,
        role,
        methodCanon,
        p.principal,
        currency,
        p.annualRate,
        now,
        p.startDate,
        p.startDate,
        operationId,
        parsePeriods(p.periods),
        p.dayCount,
        p.dayCount,
        freq === "yearly" ? "annual" : freq,
        engineVersion,
        p.notes || null,
        originationKind,
        p.name || null,
      );
      db.prepare(
        `INSERT INTO ln_schedule_snapshots (id, loan_id, version, snapshot_json, effective_from, operation_id)
         VALUES (?, ?, 1, ?, ?, ?)`,
      ).run(snapshotId, loanId, JSON.stringify(snapshot), p.startDate, operationId);
    },
  });

  return { ...result, loanId };
}
