# DATA-MODEL (sole data / field owner)

**Status:** CURRENT

## 1. Field Kind vocabulary (locked — only set)
```
RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX | REFERENCE | STATUS
```
No document may invent alternate kind enums.

| Kind | Meaning |
|------|---------|
| RAW | Observed/input fact |
| DERIVED | Rebuildable from RAW + engine version |
| SNAPSHOT | Cached projection |
| EXTERNAL_REPORTED | Provider data + provenance |
| LABEL | Display only |
| SYSTEM_INDEX | System id/index; never financial SoT |
| REFERENCE | FK / pointer |
| STATUS | Lifecycle enum |

## 2. No-field-loss
Every documented field needs: source · kind · owner · schema column or VIRTUAL/DERIVED/DEFERRED · nullable · unit · currency · formula · migration · export · reversal policy.

## 3. Identity (canonical)
| Id | Owner |
|----|--------|
| operationId | Financial operation envelope |
| instrumentId | ref_instruments |
| accountId | fin_accounts / acc_accounts (scoped) |
| holdingId | feature holding tables |
| partyId | parties (when present) |
| featureId | package id |

**Provider symbol is never instrument identity.**

## 4. Money / quantity
Decimal **strings** in DB and API for money, qty, rates, prices.

## 5. deletedAt
**Forbidden** on posted financial ledger rows. Soft-delete only on non-financial metadata when policy allows.

## 6. Machine artifacts (GENERATED)
- `docs/core/db/schema.sql`
- field-inventory.checklist.tsv
- schema.manifest.json

Prose authority is **this file**; SQL is structural truth for columns.

## 7. RelatedFeature enum
Single source values: accounts, income, expense, cheque, loan, investment.crypto|stocks|funds|metals, physical_assets, budget, goals, bills, tax.

## 8. Absorbed
Field-Level-SoT · Ownership-Matrix · PRICE-IDENTITY · RELATED-FEATURE-ENUM docs.
