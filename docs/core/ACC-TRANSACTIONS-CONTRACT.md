---
id: DOC-ACC-TX-CONTRACT
title: acc_transactions Contract
status: locked
version: 1.0
---

# P0-CASH-007 — LOCKED (Option A only)

`acc_transactions` is a **minimal cash event projection** linked to Core operations — not a second ledger.

## Required fields (schema)

| Field | Rule |
|-------|------|
| id | UUID |
| account_id | FK acc_accounts |
| operation_id | NULL only for draft; required when posted |
| business_date | DATE |
| amount | positive decimal string (domain) |
| currency | must equal account.currency (v1) |
| direction | `in` \| `out` \| NULL |

## Explicitly out of table

feeAmount, balanceAfter, type enum, exchangeRate — live on operation/journal/fee engine.

## Option B

**Rejected for v1.** Historical only — do not implement expanded parallel cash ledger columns as SoT.
