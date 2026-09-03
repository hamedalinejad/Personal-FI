# Think-tank — P0-FIX-017…020

**Members:** Double-entry · Systems · FX · Reconciliation · Product

| Fix | Consensus |
|-----|-----------|
| 017 | Posted money/qty/fee/dates/accounts/instrument/journal lines immutable; correction = reverse + new op; metadata amendment audited |
| 018 | Full historical context object; no latest×historical mix |
| 019 | Multi-hop FX path + deterministic observation order; same inputs → same output |
| 020 | reconcile detect-only; repair explicit + audit + rebuild |

---

## P0-FIX-017 — Immutable financial rows

**Schema/API must prevent direct UPDATE of:**

```text
amount · quantity · fee*
financial dates (business/trade/settlement economic dates)
financial account / finAccountId
instrument identity
journal debit/credit amounts and accounts
```

**Correction path only:**

```text
original operation → reversal operation → corrected operation
```

Metadata-only amendments (label, note, non-economic category) **must** write `fin_audit_log`.

## P0-FIX-018 — Historical context complete

Every historical report query requires:

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
engineVersions
staleStatus
```

**Forbidden:** latest price + historical cash (or any undeclared as-of mix).

## P0-FIX-019 — Multi-hop FX deterministic

Persist on conversion:

```text
conversionPath
sourcePriorityRank
asOf
source
```

Observation selection order:

```text
applicability
→ sourcePriorityRank
→ observationTime
→ sourceId / providerId
→ stable observation id ASC
```

**Done:** same dataset + same context → same output.

## P0-FIX-020 — Reconcile ≠ Repair

```text
reconcile = detect / report only (expected vs actual, delta)
repair    = explicit user command + audit + rebuild
```

**No** silent snapshot mutation.
