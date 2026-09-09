# Implementation-Ready Index — Preflight

**هدف:** هر هوش مصنوعی/فرد با این نقشه بدون اختراع قرارداد کد بزند.  
**قانون:** فقط Loan تا RELEASE-PROVEN؛ بقیه Feature موازی ممنوع (`CODING-GATE.md`).

---

## 1. Read order (اجباری)

1. `CODING-GATE.md` — DO NOTs  
2. `GO-NO-GO.md` — gates زنده  
3. `EXECUTION-HANDOFF.md` — اولویت و DoD  
4. این فایل  
5. `IMPLEMENTATION-READY-LOAN-SLICE.md`  
6. `Loan-Schedule-Engine.md` + `Canonical-Financial-Operation.md`  
7. `db/schema.sql` (جداول `ln_*`, `fin_*`)

---

## 2. Current code map (HEAD)

| Concern | Path |
|---------|------|
| Decimal boundary | `src/core/money/canonicalDecimal.js` |
| Atomic operation | `src/core/domain/operation/operationEngine.js` |
| SQLite persist | `src/core/persistence/worker.js` |
| Chart of accounts | `src/core/accounting/chartOfAccounts.js` |
| Invariants | `src/core/domain/invariants/index.js` |
| Loan schedule | `src/core/domain/loan/scheduleEngine.js` |
| Cost basis | `src/core/domain/costBasis/` + `src/core/costBasis/` |
| FX | `src/core/domain/fx/crossRate.js` |
| Price | `src/core/domain/price/provider.js` |
| Iran Toman | `src/core/iran/toman.js` |
| ValuationContext | `src/core/valuation/valuationContext.js` |
| Migration bootstrap | `src/core/db/migration.js` |
| **Loan feature** | `src/features/loan/**` |

### Loan public API (موجود)

```text
createLoan, recordPayment, reversePayment (stub)
previewSchedule, generateSchedule
getLoan, listLoans, getSchedule, getStatement
capabilities
```

---

## 3. Implementer packs

| Pack | وقتی |
|------|------|
| IMPLEMENTATION-READY-LOAN-SLICE.md | **حالا** |
| IMPLEMENTATION-READY-FEATURES.md | بعد از Loan RELEASE-PROVEN |
| IMPLEMENTATION-READY-REPORTS.md | بعد از accounting ops پایدار |
| IMPLEMENTATION-READY-IRAN.md | همراه Loan/Core |

---

## 4. Preflight (باید سبز)

```bash
npm test
npm run gates
# includes: lint, docs-validate, drift, inventory, manifest:check, bench
```

---

## 5. Remaining for Loan RELEASE-PROVEN (کار واقعی)

- [ ] `createLoan` + `ln_*` + journal در **یک** SQLite transaction  
- [ ] `recordPayment` allocation روی schedule باقی‌مانده + `ln_transactions`  
- [ ] `reversePayment` واقعی (reverses_operation_id)  
- [ ] Golden recovery: crash / conflict / backup  
- [ ] Standalone edition smoke بدون Accounts UI (الان partial)  

تا این‌ها evidence نداشته باشند → **PARTIAL** نه RELEASE-PROVEN.

---

## 6. Docs 100% for coding?

| Criterion | Status |
|-----------|--------|
| Contracts + authority | YES |
| Loan command shapes + journal templates | YES |
| Schema + inventory + drift | YES (coding baseline) |
| Runtime Loan package scaffold | YES |
| Production / full golden CI | NO |

**نتیجه:** مستندات برای شروع کد Loan کافی است. محصول کامل هنوز NO-GO است.
