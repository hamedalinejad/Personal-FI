# Personal-FI

Offline-first personal finance / wealth management (Iran-focused accounting + investments).

## What this repository is

| Layer | Status |
|-------|--------|
| Specification (`docs/`) | Mature — concept homes + implementer packs |
| Core engines (`src/core/`) | Present — money, operation, journal/SQLite, cost basis, loan schedule, FX, price |
| Feature packages (`src/features/`) | **Loan scaffold started**; other domains still docs-first |
| Full app UI / framework | **Not** a complete runnable product shell yet |

This is an **engine + specification** repository with a growing executable core — not a finished finance application.

## Quick start

```bash
npm install
npm test
node scripts/schema-drift-test.js
node scripts/field-inventory-verify.js
```

Uses **Node.js built-in test runner** (`node --test`), not Vitest.

## Docs for implementers

1. `docs/core/IMPLEMENTATION-READY-INDEX.md` — preflight  
2. `docs/core/IMPLEMENTATION-READY-LOAN-SLICE.md` — first vertical  
3. `docs/core/GO-NO-GO.md` — gates  
4. `docs/00-Product/Pages-IA.md` — **UX authority** (≤6 nav)  
5. `docs/core/ARCHITECTURE-LOCKED.md` — constitution  

## Vertical order (locked)

```text
Core → Loan-only → Crypto → Funds → Stocks Iran → Metals → Accounts full UI
```

## Architecture invariant

```text
one operation → one SQLite transaction → one journal truth → one cash truth → durable commit
```
