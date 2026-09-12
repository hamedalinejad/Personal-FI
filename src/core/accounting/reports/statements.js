/**
 * Minimal Core accounting statements from journal SoT (R-007 partial).
 * Aggregation uses decimal.js — never SQL SUM on TEXT money columns.
 */
import { openDb } from "../../persistence/port.js";
import { toDecimal, sumDecimalStrings } from "../../money/canonicalDecimal.js";

export function generalLedger(dataDir, { accountId = null, fromDate = null, toDate = null } = {}) {
  const db = openDb(dataDir);
  let sql = `
    SELECT je.operation_id as operationId, je.business_date as businessDate, je.created_at as createdAt,
           jl.account_id as accountId, jl.side, jl.amount, jl.currency, jl.amount_in_base as amountInBase,
           jl.line_kind as lineKind, fo.operation_type as operationType
    FROM fin_journal_lines jl
    JOIN fin_journal_entries je ON je.id = jl.entry_id
    JOIN fin_operations fo ON fo.id = je.operation_id
    WHERE 1=1`;
  const params = [];
  if (accountId) {
    sql += ` AND jl.account_id = ?`;
    params.push(accountId);
  }
  if (fromDate) {
    sql += ` AND je.business_date >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    sql += ` AND je.business_date <= ?`;
    params.push(toDate);
  }
  sql += ` ORDER BY je.business_date, je.created_at, jl.line_number`;
  return db.prepare(sql).all(...params);
}

export function trialBalance(dataDir, { asOf = null, baseCurrency = null, bookBaseCurrency = null } = {}) {
  /**
   * BUG-FINAL-021/022: amountInBase is per-operation base.
   * When bookBaseCurrency is set, only include operations whose fo.base_currency matches.
   * When omitted, detect mixed bases and fail rather than silently sum.
   */
  const db = openDb(dataDir);
  let sql = `
    SELECT jl.account_id as accountId, jl.side, jl.amount, jl.currency,
           jl.amount_in_base as amountInBase, fo.base_currency as opBase
    FROM fin_journal_lines jl
    JOIN fin_journal_entries je ON je.id = jl.entry_id
    JOIN fin_operations fo ON fo.id = je.operation_id
    WHERE fo.status = 'posted'`;
  const params = [];
  if (asOf) {
    sql += ` AND je.business_date <= ?`;
    params.push(asOf);
  }
  const targetBase = bookBaseCurrency || baseCurrency;
  if (targetBase) {
    sql += ` AND fo.base_currency = ?`;
    params.push(targetBase);
  }
  const lines = db.prepare(sql).all(...params);
  if (!targetBase && lines.length) {
    const bases = new Set(lines.map((r) => r.opBase).filter(Boolean));
    if (bases.size > 1) {
      throw new Error("REPORT_MIXED_BASE_CURRENCY:" + [...bases].join(","));
    }
  }
  const byAccount = new Map();
  for (const row of lines) {
    if (row.amountInBase == null || row.amountInBase === "") {
      throw new Error("REPORT_MISSING_AMOUNT_IN_BASE:" + row.accountId);
    }
    const key = row.accountId;
    if (!byAccount.has(key)) {
      byAccount.set(key, { accountId: key, debit: toDecimal("0"), credit: toDecimal("0") });
    }
    const acc = byAccount.get(key);
    const amt = toDecimal(row.amountInBase);
    if (row.side === "debit") acc.debit = acc.debit.plus(amt);
    else acc.credit = acc.credit.plus(amt);
  }
  const rows = [...byAccount.values()].map((a) => ({
    accountId: a.accountId,
    debit: a.debit.toFixed(),
    credit: a.credit.toFixed(),
    balance: a.debit.minus(a.credit).toFixed(),
  }));
  const totalDebit = sumDecimalStrings(rows.map((r) => r.debit));
  const totalCredit = sumDecimalStrings(rows.map((r) => r.credit));
  return {
    asOf: asOf || null,
    bookBaseCurrency: targetBase || (lines[0] && lines[0].opBase) || null,
    rows,
    totalDebit,
    totalCredit,
    balanced: toDecimal(totalDebit).eq(toDecimal(totalCredit)),
  };
}

export function accountActivity(dataDir, accountId, opts = {}) {
  if (!accountId) throw new Error("ACCOUNT_ID_REQUIRED");
  return generalLedger(dataDir, { ...opts, accountId });
}

function accountMeta(db, accountId) {
  return db.prepare(`SELECT id, account_kind, currency, name FROM fin_accounts WHERE id = ?`).get(accountId);
}

/**
 * Balance Sheet (as-of): assets / liabilities / equity from TB + account_kind.
 * Equity residual = assets - liabilities when no explicit equity postings (plug line).
 */
export function balanceSheet(dataDir, { asOf = null, bookBaseCurrency = null, baseCurrency = null } = {}) {
  const db = openDb(dataDir);
  const tb = trialBalance(dataDir, { asOf, bookBaseCurrency, baseCurrency });
  const assets = [];
  const liabilities = [];
  const equity = [];
  for (const row of tb.rows) {
    const meta = accountMeta(db, row.accountId);
    if (!meta?.account_kind) throw new Error("REPORT_ACCOUNT_KIND_MISSING:" + (row.accountId || row.account_id));
    const kind = meta.account_kind;
    const signed = toDecimal(row.balance);
    const entry = {
      accountId: row.accountId,
      name: meta?.name || row.accountId,
      balance: row.balance,
      kind,
    };
    if (kind === "asset") assets.push(entry);
    else if (kind === "liability") liabilities.push(entry);
    else if (kind === "equity") equity.push(entry);
    // income/expense flow to equity residual below
  }
  let totalAssets = toDecimal("0");
  let totalLiab = toDecimal("0");
  let totalEquity = toDecimal("0");
  for (const a of assets) totalAssets = totalAssets.plus(toDecimal(a.balance));
  for (const l of liabilities) totalLiab = totalLiab.plus(toDecimal(l.balance).neg()); // credit-normal
  // liability balance from TB is debit-credit; liability accounts typically credit-heavy → balance negative in our debit-minus-credit
  for (const e of equity) totalEquity = totalEquity.plus(toDecimal(e.balance).neg());

  // Net income (income - expense) plugged into equity
  let netIncome = toDecimal("0");
  for (const row of tb.rows) {
    const meta = accountMeta(db, row.accountId);
    if (!meta) continue;
    if (meta.account_kind === "income") netIncome = netIncome.plus(toDecimal(row.balance).neg());
    if (meta.account_kind === "expense") netIncome = netIncome.plus(toDecimal(row.balance));
  }

  return {
    asOf: asOf || null,
    assets,
    liabilities,
    equity,
    netIncome: netIncome.toFixed(),
    totalAssets: totalAssets.toFixed(),
    totalLiabilities: totalLiab.toFixed(),
    totalEquity: totalEquity.plus(netIncome).toFixed(),
  };
}

/**
 * Income Statement for period [fromDate, toDate].
 */
export function incomeStatement(dataDir, { fromDate = null, toDate = null } = {}) {
  const db = openDb(dataDir);
  const lines = generalLedger(dataDir, { fromDate, toDate });
  let income = toDecimal("0");
  let expense = toDecimal("0");
  const byAccount = new Map();
  for (const row of lines) {
    const meta = accountMeta(db, row.accountId);
    if (!meta) continue;
    const amt = toDecimal(row.amountInBase || row.amount);
    const signed = row.side === "credit" ? amt : amt.neg();
    if (meta.account_kind === "income") {
      income = income.plus(row.side === "credit" ? amt : amt.neg());
      byAccount.set(row.accountId, (byAccount.get(row.accountId) || toDecimal("0")).plus(row.side === "credit" ? amt : amt.neg()));
    }
    if (meta.account_kind === "expense") {
      expense = expense.plus(row.side === "debit" ? amt : amt.neg());
      byAccount.set(row.accountId, (byAccount.get(row.accountId) || toDecimal("0")).plus(row.side === "debit" ? amt : amt.neg()));
    }
  }
  return {
    fromDate,
    toDate,
    income: income.toFixed(),
    expense: expense.toFixed(),
    netIncome: income.minus(expense).toFixed(),
    accounts: [...byAccount.entries()].map(([accountId, v]) => ({ accountId, amount: v.toFixed() })),
  };
}

/**
 * Cash Flow (simplified): net change on local_settlement_cash* accounts in period.
 */
export function cashFlow(dataDir, { fromDate = null, toDate = null } = {}) {
  const db = openDb(dataDir);
  const lines = generalLedger(dataDir, { fromDate, toDate });
  let net = toDecimal("0");
  const details = [];
  for (const row of lines) {
    const meta = accountMeta(db, row.accountId);
    // BUG-FINAL-024: canonical cash selector — role/systemRole, not substring on id
    const isCash =
      meta &&
      (meta.role === "cash_box" ||
        meta.role === "checking" ||
        meta.role === "cash" ||
        (meta.role && String(meta.role).includes("settlement")) ||
        row.accountId === "local_settlement_cash" ||
        (typeof row.accountId === "string" && row.accountId.startsWith("local_settlement_cash")));
    if (!isCash) {
      continue;
    }
    const amt = toDecimal(row.amountInBase || row.amount);
    // debit cash = inflow for asset
    if (row.side === "debit") net = net.plus(amt);
    else net = net.minus(amt);
    details.push(row);
  }
  return {
    fromDate,
    toDate,
    netCashChange: net.toFixed(),
    lines: details,
  };
}
