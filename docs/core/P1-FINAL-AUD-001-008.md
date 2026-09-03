# P1 Final Audit Findings (P1-AUD-001 … 008)

> Implementable product rules. Cross-check: CANONICAL-FINANCIAL-REQUIREMENTS, Data-Dictionary, Date-Semantics, Cash Model, CFO.

---

## P1-AUD-001 — Data Dictionary is the only gate for new financial fields

A new financial field is **not allowed** without a Data Dictionary row including at least:

```text
Migration rule
Kind (RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX)
Owner
Currency semantics (if any)
Precision
SoT
```

No ad-hoc columns in Feature SQL without dictionary + migration version.

---

## P1-AUD-002 — All persisted financial numbers are strings

| Surface | Type |
|---------|------|
| DB | TEXT decimal string |
| API | string |
| JSON fixture | string (not JSON number) |
| Events | string |
| Exports | string |

**Decimal.js** only inside engine after parse at domain boundary.

---

## P1-AUD-003 — Time semantics

| Field | Representation |
|-------|----------------|
| `createdAt` / `eventAt` / `fetchedAt` | **UTC instant** (ISO-8601 with Z) |
| `businessDate` | **Gregorian DATE-only** `YYYY-MM-DD` |
| `settlementDate` / `dueDate` / `paymentDate` / `marketDate` | semantic **DATE** |
| Jalali | presentation / business-calendar **layer only** |

**Forbidden:** `toISOString().slice(0,10)` without profile timezone policy for businessDate.

---

## P1-AUD-004 — Historical valuation context

Every historical query carries:

```text
valuationAsOf
priceAsOf
fxAsOf
cashAsOf
liabilityAsOf
baseCurrency
valuationMode
cashScope
liabilityScope
```

**Invalid:** latest price + historical cash (or any mismatched as-of mix without explicit mode).

---

## P1-AUD-005 — Cash ownership

One cash pocket → **one** balance truth:

```text
fin_accounts + fin_journal_lines
```

`inv_crypto_cash`, brokerage cash projections, `acc_transactions` = **not** a second SoT.

---

## P1-AUD-006 — Posted rows immutable

Editing posted amount / qty / economic account / economic date is **forbidden**.

Correction only:

```text
original → reversal operation → corrected operation
```

---

## P1-AUD-007 — operationId idempotency

| Case | Result |
|------|--------|
| same `operationId` + same `commandHash` | **same result** (return prior) |
| same `operationId` + different payload/hash | **`IDEMPOTENCY_CONFLICT`** (or CONFLICT taxonomy) |

---

## P1-AUD-008 — Offline rebuild

`rebuild` / `reconcile` **must not** call online price/FX providers.

Use **stored** observations only (`price_history` / FX history / manual).
