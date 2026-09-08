# Implementation-Ready Spec — Loan-only Vertical Slice #1

**Status:** SPECIFIED for coding  
**Goal:** one engineer can implement without inventing contracts.

Authority chain: ARCHITECTURE-LOCKED → this file → Loan-Schedule-Engine → Debt-Loan-Management → schema.sql

---

## 1. Package layout (must create)

```text
src/features/loan/
  package.json          # name: @personal-fi/loan
  public-api/index.ts   # ONLY surface other code may import
  commands/
  queries/
  domain/
  ledger/               # ln_* writes via repositories inside feature
  reports/
  ports/                # interfaces owned by feature or re-export Core ports
  adapters/             # only wiring; LocalSettlement from Core
  fixtures/
```

**Forbidden:** `import … from '@/features/accounts/internal/…'`

---

## 2. Commands (mutate — atomic)

All commands call `runAtomicFinancialOperation`.

### 2.1 `loan.create`

```ts
type CreateLoanCommand = {
  operationId: string;           // UUID, required
  commandHash?: string;          // optional; engine may compute
  type: "loan.create";
  payload: {
    principal: string;           // decimal string > 0
    currency: string;            // e.g. "IRR"
    annualRate: string;          // decimal string >= 0
    periods: string;             // positive integer as decimal string "12"
    method: "declining_balance" | "flat_rate" | "qarz_al_hasaneh" | "bullet";
    startDate: string;           // DATE YYYY-MM-DD (canonical Gregorian storage)
    dayCount?: "period_based";   // v1 only; other values REJECT
    productTemplate?: "mehr" | "housing" | "qarz" | "custom";
    counterpartyId?: string;
    notes?: string;
  };
  // journalLines: built by command handler after schedule+disbursement
};
```

**Effects (one SQLite transaction when integrated):**
1. validate payload (decimal strings only)
2. `buildSchedule(method, params)` → pure
3. insert `ln_loans` (status `active` or `draft` per product rule)
4. insert schedule snapshot row if used
5. journal: Dr Loan Receivable / Cr Cash (disbursement) via CashSettlementPort
6. persist operation status `posted`, durability `sql_committed`

### 2.2 `loan.recordPayment`

```ts
type RecordPaymentCommand = {
  operationId: string;
  type: "loan.recordPayment";
  payload: {
    loanId: string;
    amount: string;              // > 0 decimal string
    currency: string;
    businessDate: string;        // DATE
    paymentDate?: string;        // cash movement date if different
    allocation?: "auto" | "schedule"; // auto splits interest/principal/fee/penalty
  };
};
```

**Effects:**
1. load loan + remaining schedule
2. allocate amount → principal / interest / fee / penalty components (strings)
3. insert `ln_transactions`
4. CashSettlementPort.settle({ direction: "in", amount, currency, … })
5. journal balanced lines
6. update derived remaining (rebuildable)

### 2.3 `loan.generateSchedule` (may be internal to create)

Pure function already: `buildSchedule` in `src/core/domain/loan/scheduleEngine.js`.

---

## 3. Queries (read-only)

| Query | Returns |
|-------|---------|
| `loan.get(loanId)` | loan row + derived remaining |
| `loan.list()` | summary list |
| `loan.getSchedule(loanId)` | schedule rows (rebuild if needed) |
| `loan.getStatement(loanId, from, to)` | payments + components + fees |
| `loan.capabilities()` | `{ edition: "loan-only" \| "full", cashAdapter: "local" \| "accounts" }` |

---

## 4. CashSettlementPort (exact)

```ts
interface CashSettlementRequest {
  operationId: string;
  amount: string;          // decimal string > 0
  currency: string;
  direction: "in" | "out"; // in = payment received; out = disbursement
  businessDate: string;
  memo?: string;
}

interface CashSettlementPort {
  settle(req: CashSettlementRequest): Promise<{
    finAccountId: string;
    journalLines: Array<{
      accountId: string;
      side: "debit" | "credit";
      amount: string;
      currency: string;
    }>;
  }>;
}
```

- **LocalSettlementAdapter:** resolves `fin_accounts` where systemRole = `local_settlement_cash` (create if missing in edition bootstrap).
- **AccountsCashAdapter:** resolves user-selected bank `fin_accounts` / linkage.
- **Never** write cash balance to `ln_*` tables.

---

## 5. API envelope

```ts
// success
{
  apiVersion: "1",
  schemaVersion: "1",
  data: { /* result */ },
  operationId: string,
  commandHash: string,
  engineVersions: { money: string, loanSchedule: string }
}

// error
{
  apiVersion: "1",
  error: {
    code: "VALIDATION_ERROR" | "IDEMPOTENCY_CONFLICT" | "INSUFFICIENT_BALANCE" | …,
    message: string,
    retryable: boolean,
    userActionRequired: boolean
  }
}
```

---

## 6. Tables touched (schema already exists)

| Table | Role |
|-------|------|
| `ln_loans` | loan master |
| `ln_transactions` | payment/disbursement log |
| `ln_schedule_snapshots` | optional snapshot_json |
| `ln_loan_fees` | fees due/paid/waived |
| `fin_operations` | operation header |
| `fin_journal_entries` / `fin_journal_lines` | accounting SoT |
| `fin_accounts` | cash + receivable accounts |

---

## 7. Acceptance tests (must be green)

| # | Test |
|---|------|
| A1 | `createLoan` posts operation + balanced journal |
| A2 | same operationId + same hash → idempotent replay |
| A3 | same operationId + different hash → IDEMPOTENCY_CONFLICT |
| A4 | schedule declining 12 periods residual balance 0.00 |
| A5 | recordPayment splits components; journal balanced |
| A6 | Loan-only: no import from accounts feature internals |
| A7 | toDecimal rejects JS number |
| A8 | backup/restore keeps ln_* + journal (when backup API exists) |
| A9 | decimal strings only in fixtures (no JSON numbers for money) |

---

## 8. Out of slice #1 (do not block start)

- actual_365 / holiday calendar full engine  
- Full Accounting UI  
- Multi-currency payment FX complexity beyond storing rate on tx  
- Feature packages for crypto/stocks  

---

## 9. Definition of done for slice #1

```text
SPECIFIED → IMPLEMENTED-IN-CORE (engines exist)
         → INTEGRATED (src/features/loan public-api)
         → RELEASE-PROVEN (A1–A9 + npm test green)
```

Only then: enable Full Accounting UI without migration.
