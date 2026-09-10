---
id: DOC-AUTH-ACCT-RULES
title: Immutable Accounting Rules
status: approved
version: 1.0
updated: 2026-09-10
authority: binding
---

# Accounting rules that must remain immutable

These are **not** suggestions.

## Rule 1 — One operation, one durable operation identity

`operationId` is globally stable within the database scope.

## Rule 2 — One economic event, one journal truth

Do **not** post feature ledger + separate accounting journal as parallel truths. Feature tables are domain evidence; Core journal is accounting SoT.

## Rule 3 — No silent defaults

Forbidden for financial correctness:

```text
missing businessDate → today
missing baseCurrency → IRR
missing price → 0
missing FX → 1 or 0
unknown fee treatment → guessed
```

## Rule 4 — No float

Money / quantity / rate / price: **decimal strings** and decimal arithmetic only. Locked in Financial-Invariants.

## Rule 5 — Toman is display, not a second accounting currency

```text
DB currency = IRR
UI display = Rial or Toman
```

Do not introduce parallel TOM, IRT, etc. as ledger currencies.

## Rule 6 — Financial correction means reversal / new operation

Never overwrite in place: posted amount, price, quantity, fee.

## Rule 7 — Derived values are rebuildable

Holding quantity, total invested, average cost, remaining balance, portfolio snapshot must have a source (operations + domain tx + journal).
