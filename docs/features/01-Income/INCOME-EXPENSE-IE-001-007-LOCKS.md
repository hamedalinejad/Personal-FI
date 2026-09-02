# Income / Expense Locks IE-001 … IE-007 (P0)

Applies to Income and Expense features jointly where shared.

---

## IE-001 — Correction = Core reversal only

Correction path:

```text
core.reverseOperation(original)
→ optional new income/expense operation
```

**Forbidden:** Feature docs/APIs that instruct manual void + hand-written opposite `acc_transactions` without Core reverse (X-001/X-002).

## IE-002 — Future dates vs businessDate

“Future” validation uses **businessDate** in the **user timezone** (settings), not only server UTC `createdAt`.

## IE-003 — Refund / chargeback

Dedicated command path: refund/chargeback linked to original via reverse or explicit `refundOfOperationId` graph — not a generic income/expense with only a memo.

## IE-004 — Investment cash flows ≠ ordinary I/E

Buys/sells/dividends/interest from investments classified as **investment operations** (relatedFeature + types), not generic `income`/`expense` that distort operating P&L unless user explicitly records a non-investment personal flow.

## IE-005 — Recurring vs Bills exclusivity

An occurrence has **one** generator source (Bills/recurring template XOR ad-hoc).

```text
UNIQUE(templateId, scheduledOccurrenceKey)
```

No double materialization from both Bills and a parallel Income/Expense recurring engine for the same logical bill.

## IE-006 — Category → COA mapping

Controlled categories map to chart-of-accounts / journal accounts via canonical **categoryId → COA** mapping (registry). Free-text category is not a journal account code.

## IE-007 — Standalone vs Accounts dependency

Each Feature documents:

| Mode | Cash |
|------|------|
| Integrated | optional/required link to Accounts |
| Standalone | CashSettlementPort local/external; **or** explicit “Accounts required” |

Income/Expense standalone must state whether CashSettlementPort local account is enough or Accounts Feature is mandatory.

---

## Status: IE-001…IE-007 **LOCKED** 2026-09-02
