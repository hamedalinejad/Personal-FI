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

## اولویت قبل از Coding

🔴 Cash SoT · Field dictionary · RAW/DERIVED/EXTERNAL · FX convention · Stock settlement · Loan fee/allocation/day-count · Crypto fee matrix · Physical delivery op · Polymorphic policy · Backup+docs · Multi-tab · Migration version · Instrument≠symbol  

🟠 Tax rule version · Fund profiles · CA invariants · Price policy · License · Dependency/Ownership matrices  

🟢 Cloud · Multi-user · AI · …

**عمداً اضافه نمی‌کنیم v1:** event sourcing کامل، microservices، CQRS framework، multi-user RBAC، cloud backend.

## آخرین اصلاحیه

- `P0-FINAL-041-051-LOCKS.md`
- `CODING-GATE.md` — ترتیب اجباری قبل از کد
- Golden 12 vectors در `fixtures/README.md`
- P1-FINAL-050: هر چک‌لیست = GREEN یا EXPLICITLY_OUT_OF_SCOPE
