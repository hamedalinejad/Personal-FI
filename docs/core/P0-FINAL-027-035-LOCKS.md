# P0-FINAL-027…029 · P1-FINAL-030…032 · P0-FINAL-033…035

---

## P0-FINAL-027 — Schedule vs accrual vs settled (Loan)

| Concept | Meaning | Liability impact |
|---------|---------|------------------|
| **scheduled amount** | Installment projection on schedule snapshot | Not yet liability unless policy says due |
| **accrued amount** | Interest/fee accrued by day-count events | Increases interest payable / receivable when **accrual event posted** |
| **settled amount** | Payment allocation applied | Reduces outstanding components |

v1: schedule rows are **projection**. Accrual enters books only via explicit **accrual operation** (or payment that simultaneously accrues+settles — must still allocate components). Do not treat “next installment interest” as posted liability merely because it appears on schedule.

---

## P0-FINAL-028 — Variable-rate interval fixture

```text
id: LOAN-VAR-RATE-MID-PERIOD
principal: 10000000 IRR
dayCount: actual/365 (example)
period: Jan 1 → Feb 1 (31 days)
rates:
  Jan 1 inclusive → Jan 15 exclusive: 4% annual
  Jan 15 inclusive → Feb 1 exclusive: 5% annual
accrual:
  days1 = 14, days2 = 17
  interest1 = 10000000 × 0.04 × (14/365)
  interest2 = 10000000 × 0.05 × (17/365)
  total = interest1 + interest2
```

Exact decimal strings after RoundingPolicy must be locked in fixture file when implemented; algorithm = rate-by-interval (LN-001), not single rate at dueDate.

---

## P0-FINAL-029 — Multi-currency loan journal mapping

On repayment when settlement currency ≠ contract currency:

```text
contractPrincipalPortion (contract CCY)
settlementCash (settlement CCY) × path → book base
carryingPrincipalReleased (book)
FX gain/loss = settlementInBook − carryingReleased (for principal portion; interest similar)

Journal sketch:
  Dr Liability principal (carrying)
  Dr/Cr FX loss/gain
  Cr Cash (settlement converted / multi-currency cash accounts per Canonical-Cash)
```

Accounts: liability in contract tracking + book carrying; FX gain/loss P&L accounts; cash in settlement account. Exact COA codes product-specific; **roles** above mandatory.

---

## P1-FINAL-030 — Feature authority chain

```text
Feature README
  → *-LOCKS.md (P0 locks for that feature)
  → Main Feature *.md (implementation spec)
  → Core references (engines, P0-FINAL-*, P1-GLOBAL)
```

Contradictory old prose: mark `> LEGACY — superseded by LOCKS` or delete. Coding uses LOCKS over unmarked old examples.

---

## P1-FINAL-031 — One canonical file per concept

| Concept | Canonical | Others |
|---------|-----------|--------|
| Naming glossary | `docs/core/NAMING-GLOSSARY.md` | `Naming-Glossary.md` → pointer only |
| Rounding policy | `docs/core/Rounding-Policy.md` | `docs/core/rounding/Rounding-Policy.md` → pointer only |

No second full body.

---

## P1-FINAL-032 — Feature `spec.md` purpose

```text
spec.md = short implementation entrypoint (scope, links to LOCKS + main doc + engines)
NOT a competing full authority
```

If main doc is large, `spec.md` must link upward and say: **authority = LOCKS + main Feature md**.

---

## P0-FINAL-033 — Golden fixture schema (numeric)

Each fixture JSON (or YAML) before release of that area:

```json
{
  "id": "…",
  "engineVersions": {},
  "input": {},
  "expected": {
    "domain": {},
    "journal": [],
    "cash": {},
    "holding": {},
    "costBasis": {},
    "realizedPnl": {},
    "unrealizedPnl": {},
    "attribution": {},
    "wealthDelta": {}
  }
}
```

All financial numbers = **strings**. Inventory names in P1-IRAN doc must be filled to this shape progressively; gate: scoped release fixtures green.

---

## P0-FINAL-034 — Negative / failure fixtures

Minimum expected typed errors:

| Case | Error (canonical family) |
|------|---------------------------|
| negative cash result | INSUFFICIENT_BALANCE |
| negative quantity | VALIDATION_ERROR |
| wrong FX direction / inconsistent path | VALIDATION_ERROR |
| missing price (FAIL policy) | STALE_DATA or VALIDATION_ERROR |
| missing historical FX (FAIL) | same |
| duplicate operationId different payload | IDEMPOTENCY_CONFLICT |
| reverse already reversed | CONFLICT |
| invalid instrumentId | NOT_FOUND / VALIDATION_ERROR |
| cross-currency fee without rate | VALIDATION_ERROR |
| settlement before trade / out of order | VALIDATION_ERROR / CONFLICT |

---

## P0-FINAL-035 — Reversal before/after pairs

Every financial op kind in scope needs:

```text
before → post → reverse → after_reverse
assert after_reverse == before
```

for holdings, cash, cost basis, fee effective metrics, journal balances, realized accumulators (as defined).

---

## Status: LOCKED (027–035)
