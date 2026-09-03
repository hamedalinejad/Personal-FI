# Coding Gate — Exact Order (آخرین اصلاحیه قبل از کد)

هیچ Feature implementation تا اتمام Gate A–D.

## Gate A — Contract cleanup (P0 list)

بدون Feature جدید؛ بستن/تأیید:

```
P0-FINAL-001 … 013, 015 … 029, 033 … 035, 039, 040, 041, 043, 048, 049
```

(جزئیات در `P0-FINAL-*-LOCKS.md` و اسناد Core.)

P1 همراه: 036–038, 042, 044–047, 050, 051.

## Gate B — Canonical docs cleanup

- Remove/mark contradictory legacy prose
- One authority per concept (`Concept-Ownership-Matrix`)
- Resolve duplicate doc names
- `spec.md` = alias only → main Feature doc

## Gate C — Fixture Green

12 golden vectors + standalone scenarios implemented in test harness and **green**.

## Gate D — Schema Freeze

Explicit and frozen:

```
tables · columns · types · FKs · unique indexes · check constraints
nullable rules · indexes · migration version
```

Source: `docs/core/db/01-schema-tables.md` + constraints docs.

## Gate E — First Coding (only after A–D)

```text
Core Decimal / Money / FX
  → Core Operation
  → Journal / Cash
  → Reversal
  → Cost Basis
  → Reconciliation
  → Feature 00 Accounts
  → Core simple Income / Expense
  → Investments
```

## Architecture test (ongoing)

Only mutation path: Feature Command → Operation Builder → Core → Journal/Cash → projection.

036–040 index: `P0-FINAL-036-040-LOCKS.md` · 006–015: `P0-FINAL-006-015-LOCKS.md`

**P0-018:** Until fixture harness is green, **Gate C = BLOCKED** — see `fixtures/HARNESS.md`.

Implement against **`CANONICAL-FINANCIAL-REQUIREMENTS.md`** — non-negotiable regardless of UI.

Per-feature must-support: `FEATURE-IMPLEMENTATION-REQUIREMENTS.md`.

Schema freeze checklist: `db/SCHEMA-FREEZE-REQUIREMENTS.md`.
Golden gate: `fixtures/GOLDEN-GATE.md`.

## P0-FINAL-AUD-001…004

See `P0-FINAL-AUD-001-004.md`.

- Critical fixture harness: **exists** (`npm test` / vitest fixtures)
- Full Gate C: still blocked for non-critical families
- Gate D: blocked until schema.sql + drift test
- Cost helpers: only `src/core/costBasis/{transferCost,bridgeCost,applyEconomicSwap}.ts`
