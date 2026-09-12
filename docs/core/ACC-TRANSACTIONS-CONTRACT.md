---
status: accepted
---

# acc_transactions Contract — P0-002 Resolution

**Status:** ACCEPTED — minimal contract aligned with schema `acc_transactions` + links (2026-09-12)

---

## Problem Statement

Documentation in `docs/features/00-Accounts-Banking/Accounts-Banking.md` requires fields that are missing from `docs/core/db/schema.sql`:

| Required by Docs | Present in Schema |
|------------------|-------------------|
| `date` | ✗ |
| `type` | ✗ |
| `feeAmount` | ✗ |
| `feeCurrency` | ✗ |
| `exchangeRateToBase` | ✗ |
| `balanceAfterTransaction` | ✗ (has `currentBalance` on account only) |
| `relatedTransactionId` | ✗ |
| `isVoided` | ✗ |
| `source` | ✗ |

## Two Resolution Paths

### Option A — Recommended: Minimal Cash Event Table

Treat `acc_transactions` as a **minimal cash event log + UX projection**:

```sql
CREATE TABLE IF NOT EXISTS acc_transactions (
  id              TEXT PRIMARY KEY,
  account_id      TEXT NOT NULL REFERENCES acc_accounts(id),
  operation_id    TEXT REFERENCES fin_operations(id),
  business_date   TEXT NOT NULL,
  amount          TEXT NOT NULL,
  currency        TEXT NOT NULL,
  direction       TEXT,
  memo            TEXT,
  created_at      TEXT NOT NULL
);
```

**Semantic meaning moves to:**
- `fin_operations.operation_type` — complete transaction type enum
- `acc_transaction_links` — polymorphic links to related records

**Advantages:**
- Clean separation: `fin_operations` = business logic, `acc_transactions` = cash log
- Aligns with "cash balance SoT = journal lines" principle
- Simpler schema, easier maintenance

### Option B: Expand Schema to Document Contract

Add missing fields to match documentation:

```sql
ALTER TABLE acc_transactions ADD COLUMN date TEXT;
ALTER TABLE acc_transactions ADD COLUMN type TEXT;
ALTER TABLE acc_transactions ADD COLUMN fee_amount TEXT;
ALTER TABLE acc_transactions ADD COLUMN fee_currency TEXT;
ALTER TABLE acc_transactions ADD COLUMN exchange_rate_to_base TEXT;
ALTER TABLE acc_transactions ADD COLUMN balance_after_transaction TEXT;
ALTER TABLE acc_transactions ADD COLUMN related_transaction_id TEXT;
ALTER TABLE acc_transactions ADD COLUMN is_voided INTEGER DEFAULT 0;
ALTER TABLE acc_transactions ADD COLUMN source TEXT;
```

**Disadvantages:**
- Denormalization: `type`, `is_voided` duplicated from `fin_operations`
- Risk of inconsistency between tables
- More complex migration

## Recommendation: Option A

**Rationale:**
1. `acc_transactions` already described as "bank/account event log + UX projection" (not authoritative)
2. `fin_operations` already has `operation_type` and `status` fields
3. Cash balance SoT = `fin_journal_lines` (not `acc_transactions`)
4. Semantic type should live in one canonical place: `fin_operations.operation_type`

## Implementation Steps (Option A)

1. **Update `acc_transactions` schema** to minimal set (current state is acceptable)
2. **Document** that `acc_transactions` = cash movement log only
3. **Move semantic type** to `fin_operations.operation_type` (or derive from domain tables)
4. **Use `acc_transaction_links`** to relate to specific domain transactions
5. **Update `Accounts-Banking.md`** to reflect minimal schema

## Future Enhancement (Optional)

If richer metadata is needed, consider a separate projection table:

```sql
CREATE TABLE acc_transaction_metadata (
  transaction_id TEXT PRIMARY KEY REFERENCES acc_transactions(id),
  type TEXT NOT NULL,
  fee_amount TEXT,
  fee_currency TEXT,
  exchange_rate_to_base TEXT,
  related_transaction_id TEXT
);
```

This keeps the core log minimal while allowing extensibility.
