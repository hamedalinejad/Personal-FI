# Phase A — Specification Freeze (قبل از Coding Feature)

دیگر Feature جدید اضافه نکنید تا این ۸ سند + تطبیق Featureها پایدار شوند:

| # | سند |
|---|-----|
| 01 | `Source-of-Truth-Matrix.md` |
| 02 | `Data-Dictionary.md` |
| 03 | `Domain-Dependency-Matrix.md` |
| 04 | `Canonical-Financial-Operation.md` |
| 05 | `Financial-Scenarios.md` |
| 06 | `fixtures/README.md` (+ golden JSONها) |
| 07 | `Data-Model-Relationship-Matrix.md` |
| 08 | `Feature-API-Contract.md` |

سپس هر Feature doc با این ۸ تا align شود.

## معماری هدف

```text
UI (~9 pages) → Feature API (commands/queries)
  → Application → Accounting / Investment / Loan cores
  → Engines (FX, Cost, Rounding, Valuation, Calendar)
  → Storage API → SQLite WASM | Native Desktop | future cloud
```
