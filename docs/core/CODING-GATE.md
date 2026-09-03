# Coding Gate — Final Order

**Status:** BLOCKED until the canonical documentation contradictions in `FINAL-AUDIT-2026-09.md` are resolved and the scoped golden fixture pack is green.

## Gate A — Contract cleanup

Resolve all P0 items in:

- `docs/core/FINAL-AUDIT-2026-09.md`
- `docs/core/CANONICAL-FINANCIAL-REQUIREMENTS.md`
- Core identity / cash / fee / FX / loan / valuation contracts

The final audit is the blocking cross-document review. A later lock file may add detail, but may not contradict the canonical financial requirements.

## Gate B — Canonical docs cleanup

- Remove or explicitly mark contradictory legacy prose.
- One authority per concept.
- One field kind enum: `RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX`.
- `instrumentId = ref_instruments.id` for financial assets; `symbol` is never identity.
- Cash truth is `fin_accounts + fin_journal_lines`.
- `acc_transactions` and feature cash fields are event/projection layers only.
- `spec.md` is an implementation entrypoint, not a competing authority.

## Gate C — Numeric fixture green

Minimum before feature coding:

```text
critical fixtures
+ core reversal/failure fixtures
+ standalone Loan/Crypto/Fund fixtures
+ scoped Iran stock/fund/loan fixtures
```

Every persisted financial number in fixtures is a decimal string. No JSON number is accepted.

## Gate D — Schema Freeze

Freeze:

```text
tables · columns · types · FKs · nullable rules
unique/partial unique indexes · structural constraints
field ownership · migration version · preservation policy
```

Source set: `docs/core/db/01-schema-tables.md`, constraints, Data Dictionary and Field-Level ownership matrix.

## Gate E — First implementation order

```text
Decimal / Money / Rounding / FX
→ Core Financial Operation
→ Journal / Cash Settlement
→ Reversal / Idempotency
→ Cost Basis / Valuation
→ Reconciliation / Repair
→ Accounts
→ Income / Expense
→ Loans
→ Investments
```

## Architecture invariant

Only this mutation path is legal:

```text
Feature Command
→ Operation Builder
→ Core validation + engines
→ domain ledger + Journal + CashSettlementPort
→ projections
→ durable commit
```

No feature may write another feature's tables directly. No feature may maintain a second cash balance truth.

## Current blockers

1. Documentation contradictions listed in `FINAL-AUDIT-2026-09.md`.
2. Full field-level dictionary/relationship coverage is not yet provable for every Feature field.
3. Full numeric golden pack is not yet implemented.
4. Feature implementations do not yet exist, so runtime verification is necessarily limited to Core helpers/fixtures.

**Do not remove this block by changing status text. Change status only after evidence is green.**
