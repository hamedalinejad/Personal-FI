# Loan Locks LN-001 … LN-015 (P0)

هم‌راستا با Loan-Schedule-Engine و BATCH-3 loan sections. در تعارض با prose قدیمی Feature، این سند برنده است.

---

## LN-001 — Variable rate selection

`effectiveDate <= dueDate` alone is insufficient for variable rates.

```text
rate for accrual interval [t0, t1) =
  rate series row applicable to that interval
  (not merely “latest rate with effectiveDate ≤ installment dueDate”)
```

Document interval boundary policy (include start / exclude end).

---

## LN-002 — dayCount vs period-based

Explicit `calculationMode` (or equivalent) on product/schedule:

| Mode | Use |
|------|-----|
| `day_count` | interest from dayCount convention × principal × rate |
| `period_based` | fixed period interest per schedule period |
| hybrid only if fully specified |

Precedence must be unambiguous; silent mix forbidden.

---

## LN-003 — Grace capitalization

Grace period policy explicit flags:

```text
accrueDuringGrace: boolean
capitalizeAtGraceEnd: boolean
forgiveGraceInterest: boolean
```

Combinations documented; no implied capitalize.

---

## LN-004 — Partial payment residuals

After partial pay, **each component** keeps outstanding:

```text
principalOutstanding
interestOutstanding
feeOutstanding
penaltyOutstanding
```

Not a single residual blob that loses component identity.

---

## LN-005 — Fee due / paid / waived

```text
feeAssessed / feeDue
feePaid
feeWaived
feeOutstanding = due − paid − waived
```

Assessment events vs settlement (payment allocation) are separate records (BATCH-3 §5).

---

## LN-006 — Early payment → new schedule version

Early payoff / large prepayment that changes future installments:

- Create **immutable new schedule snapshot/version**
- Prior version retained for audit
- Payments reference scheduleVersion

---

## LN-007 — Final installment exact principal

Last installment (or payoff):

```text
principalPortion = exact remaining principalOutstanding
```

No systematic leftover pennies from amortization rounding without a documented residual policy applied to the final period.

---

## LN-008 — Multi-currency repayment

When contractual currency ≠ settlement currency:

```text
contractCurrency
settlementCurrency
book FX at payment (rate + asOf + path)
explicit FX gain/loss realization if policy requires
```

Do not hide FX in principal only.

---

## LN-009 — Multiple draws

**v1 decision (locked):** multi-draw facilities are **out of scope** unless product flag `multiDraw=true` and each draw is a **draw operation** increasing principal with its own operationId.

Default products: single disbursement. Undocumented multi-draw = forbidden.

---

## LN-010 — Waiver / write-off / settlement discount

Independent **adjustment operations** (not silent balance edits):

- interest/fee waiver  
- principal write-off / forgiveness  
- settlement discount on close  

Each with operationId + audit.

---

## LN-011 — Refinance / restructure / reschedule

```text
parentOperationId / supersedesScheduleVersion
new schedule version
link prior loan state
```

Lineage required; replacing schedule in place without version = forbidden.

---

## LN-012 — Penalty compounding

Explicit rule:

```text
penaltyAccrualPolicy: simple | compound_on_overdue | …
base: overdue principal | overdue interest | both
```

No implied compound.

---

## LN-013 — Borrowed vs lent journal mapping

Separate accounting mappings:

| Role | Journal / account treatment |
|------|-----------------------------|
| User **borrowed** (liability) | liability ↑ on disbursement |
| User **lent** (asset receivable) | asset ↑ on disbursement |

Do not reuse one mapping for both directions.

---

## LN-014 — Cancel after disbursement

After disbursement, cancel path = **Core reverse** of disbursement (and dependent ops), subject to **no later payment** guard (or reverse payments first).

Feature-local “cancel” that zeros balances without reverse = forbidden (aligned P0-041).

---

## LN-015 — Loan-only local settlement

Standalone / no bank account mode:

```text
LocalSettlementAdapter → fin_account (local cash / contra)
```

Money remains reportable on a canonical fin_account; not an invisible side pocket outside cash model.

---

## Status

| ID | Status |
|----|--------|
| LN-001 … LN-015 | **LOCKED** 2026-09-02 |
