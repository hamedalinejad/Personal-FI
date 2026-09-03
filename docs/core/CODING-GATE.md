# Coding Gate — Final Order

**Status:** Gate A (P0-DOC contracts) largely closed — see `P0-DOC-001-014-VERIFY.md`. **Still BLOCKED** on Gate C (full golden fixtures executable) and Gate D (schema freeze + relationship coverage). Authority: `GO-NO-GO.md` + `FINAL-THINK-TANK-AUDIT-2026-09-03.md` (historical) + concept homes.

## Gate A — Contract cleanup

Resolve all P0 items in:

- `docs/core/FINAL-THINK-TANK-AUDIT-2026-09-03.md` (historical audit)
- `docs/core/GO-NO-GO.md`
- `docs/core/P0-DOC-001-014-VERIFY.md`
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

1. Residual OPEN items in `docs/core/OPEN-ISSUES-REGISTER.md` (schema freeze, fixtures, relationship matrix).
2. Full field-level dictionary/relationship coverage is not yet provable for every Feature field.
3. Full numeric golden pack is not yet implemented.
4. Feature implementations do not yet exist, so runtime verification is necessarily limited to Core helpers/fixtures.

**Do not remove this block by changing status text. Change status only after evidence is green.**

P0-FIX-017…020: `AUDIT-HISTORY-NOTE.md`.

P1-FIX-001…009: `AUDIT-HISTORY-NOTE.md`.

Doc merge/delete rules: `DOC-CONSOLIDATION-POLICY.md`.

## Final Audit work order (authority)

```text
Phase 1 — close P0-DOC-001…014 contradictions
Phase 2 — schema freeze (relationship + field inventory)
Phase 3 — golden gate green
Phase 4 — Core engines only
Phase 5 — vertical: Accounts → Loan → Crypto → Funds → Stocks → Metals
```

**GO limited Core/fixtures; NO full Feature implementation until Phase 1–3 green.**
