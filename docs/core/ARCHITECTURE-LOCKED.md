# Architecture Locked — Pre-Coding Constitution

**Status:** LOCKED for implementation design  
**HEAD note:** Live status = `GO-NO-GO.md` + `OPEN-ISSUES-REGISTER.md`  
**Rule:** Do not invent parallel P0 files. Amend concept homes only.

---

## 1. Accounting pipeline (heart, not a page)

```text
Feature Command
  → Public Feature API
  → runAtomicFinancialOperation(operationId)
      1) validate
      2) feature domain writes
      3) fin_journal_entries + fin_journal_lines
      4) CashSettlementPort → fin_accounts + journal lines
      5) derive snapshots
      6) SQL COMMIT → fin_operations.status = posted
                      db_meta.durabilityState = sql_committed
      7) durable persistence → durabilityState = persisted | persist_failed
      8) audit/event only after persisted
```

Accounting is the **system heart**, not a primary navigation page. Simple expense forms must not expose debit/credit; Core emits double-entry automatically.

| Principle | Law |
|-----------|-----|
| Cash SoT | `fin_accounts` + `fin_journal_lines` |
| Domain SoT | feature specialty ledger for quantity/state |
| Snapshot | derived/cache only; never sole report source |
| Correction | reversal + new operation; never financial UPDATE |
| Idempotency | same `operationId` + same `commandHash` → prior result; different hash → `IDEMPOTENCY_CONFLICT` |
| Money | TEXT decimal string; compute with decimal.js |
| Historical | `amountInBase` / operation context immutable after post |
| Reconcile | detect/report; repair = explicit command + audit + rebuild |
| Business status | `pending` \| `posted` \| `voided` \| `failed` |
| Durability | `sql_committed` \| `persisted` \| `persist_failed` in **db_meta only** |

---

## 2. Data model freeze targets

### Core (must exist in schema.sql)

- `fin_accounts`, `fin_operations`, `fin_journal_entries`, `fin_journal_lines`
- `fin_reconcile_runs`, `fin_audit_log`
- `ref_instruments`, `ref_parties`

### Feature domains (prefixes)

`acc_*` · `inc_*` / `exp_*` · `chk_*` · `ln_*` · `inv_crypto_*` · `inv_stocks_iran_*` · `inv_fif_*` · `inv_metals_*` · `pa_*` · `bg_*` / `fg_*` / `br_*` / `notif_*` · `rep_*` / `port_*` / `dash_*` / `tax_*` · `docs_*` · `cur_*` · `price_*`

**Law:** Table count is fine. Two tables owning the same truth is not. Feature `cashBalance` = projection only.

---

## 3. Spec completeness checklist (must be testable)

### 3.1 Accounting
Journal header/line · debit/credit · accountClass/lineKind · operationId/commandHash · multi-currency · exchangeRateToBase/amountInBase · fiscal lock · opening · reversal · audit · trial balance · reconcile without mutation

### 3.2 Simple user posting
quick income/expense · transfer · split · refund · payee · category · tags · notes · attachments · provenance · opening/historical balance

### 3.3 Iran / money / date
IRR storage · Toman display/input · Jalali presentation only · businessDate DATE-only · market/settlement/due/payment dates · Iran calendar adapter · Sayadi/IBAN normalize · Iran rounding policy

### 3.4–3.9 Domains
Crypto (fee roles, bridge, C2C economic, WAC, 2-axis PnL) · Stocks Iran (T+2, CA engine, ISIN, fees) · FIF (NAV≠txPrice, reinvest two legs) · Loans (components, residual, schedule version) · Metals (fine weight, delivery) · Physical assets

### 3.10–3.13
Cheque · Budget/Goals/Bills/Notifications (never mutate finance) · Reports (ValuationContext) · Tax (canonical tax event)

### 3.14–3.18
Price/FX provenance · Offline recovery · Standalone editions · API transport-agnostic · Schema/migration no-field-loss

Full bullet lists remain in feature docs + `FEATURE-IMPLEMENTATION-REQUIREMENTS.md`. This file is the **constitution index**.

---

## 4. API & standalone editions

v1 API = **in-process TypeScript Public API** (not HTTP-first). Same contract may later sit behind REST/IPC/Mobile.

```text
commands → mutate (atomic)
queries  → read/calculate
events   → after durable persistence
capabilities() → edition support
```

| Edition | Essential | Cash path |
|---------|-----------|-----------|
| Loan-only | Loan + Core + Port | LocalSettlementAdapter → fin_accounts/journal |
| Crypto-only | Crypto + Core + CostBasis | LocalSettlementAdapter → journal |
| Fund-only | FIF + Core | LocalSettlementAdapter → journal |
| Stocks-only | Stocks + Core | LocalSettlement / brokerage capability |
| Metals-only | Metals + Core | LocalSettlementAdapter → journal |
| Full | Full Core + optional Accounts UI | AccountsCashAdapter → journal |

**Commercial lock:** License/edition flags are **capability gates only**. They must never wipe journal, history, or accounting SoT.

---

## 5. UX — nine pages max

| # | Page | Content |
|---|------|---------|
| 1 | Dashboard | NW, cash, alerts, recent |
| 2 | Accounts / Money | balances, transfer, reconcile entry |
| 3 | Transactions | All/Income/Expense/Transfer/Cheque/Adjustment + Sheets |
| 4 | Investments | Overview + Crypto/Stocks/Funds/Metals tabs |
| 5 | Loans | schedule, payment, fees |
| 6 | Assets / Planning | physical + budget + goals |
| 7 | Reports / Wealth | accounting + investment + tax + wealth |
| 8 | Documents / Imports | docs, import, provenance |
| 9 | Settings / Tools | currency, prices, backup, security, license |

**Feature = Domain boundary · Page = UX boundary.** Domain growth must not grow navigation.

Canonical IA detail: `docs/00-Product/Pages-IA.md`.

---

## 6. Deletion / retention policy

### Must not resurrect (deleted authority noise)

P0/P1 THINK-TANK session logs, CROSS-FEATURE-BUGS-2026-09, DEEP/FEATURE bug registers, BUGS-REPORT, investment-fee-currency-handling ad-hoc notes — see `Deletion-Policy-Matrix.md` / git history.

### Must keep

Data-Dictionary · Field-Level SoT/Ownership · Source-of-Truth · Domain-Dependency · Feature-API · Feature-Independence · Cash-Settlement · Canonical-Cash · Instrument-Identity · CANONICAL-FINANCIAL-REQUIREMENTS · CODING-GATE · fixtures/** · features/** · GO-NO-GO · DOC-CONSOLIDATION-POLICY · AUDIT-HISTORY-NOTE · this file

### Pointer-only (no new body)

FINAL-AUDIT-2026-09 · Naming-Glossary · Core-Engines · Financial-Scenarios · rounding/Rounding-Policy path

### P0 lock files

Do **not** bulk-delete. Migrate unique rules into concept homes; mark superseded LEGACY; numbers are traceability only.

---

## 7. Acceptance gates (A–H)

| Gate | Criterion |
|------|-----------|
| A Authority | one authority/concept; zero broken links |
| B Schema | 100% table/column/FK/nullable/unique/index/owner/migration |
| C Numeric | all listed golden fixtures green; strings only; invalid cases green |
| D Financial path | Feature API → Operation → Core → Journal/Cash → projection → persist |
| E Standalone | Loan/Crypto/Fund/Stocks/Metals without Accounts UI |
| F Offline | airplane + crash recovery + backup/restore + stale price |
| G Rebuild | same ledger + engineVersions + ValuationContext + datasets → same report |
| H No-field-loss | Domain → Schema → API → Migration → Fixture → Query traceable |

---

## 8. Mandatory golden fixture families

Toman→IRR · Transfer+fee · Crypto fee_in_quote / fee_from_base / sell fee · network burn · internal transfer · bridge · C2C economic · BTC/USDT/IRR attribution · Stock fee breakdown · T+2 · CA · dividend gross/net · Fund NAV≠txPrice · reinvest · Loan declining/flat/bullet/qarz/variable/grace/partial/FX · Metals purity/delivery · Cheque clear→bounce · Opening · Reversal · Idempotency match/conflict · Restore+attachments · Standalone five editions

Gap tracking: `docs/core/fixtures/OPEN-004-FIXTURE-GAP.md`

---

## 9. Never drop from the model

raw source values · gross/net/fee qty · original amount+currency · historical FX at op · priceAsOf/fxAsOf · operationId · commandHash · reversal links · instrumentId · external provider IDs · source documents · importBatchId · CA provenance · loan schedule version · fee role · costCurrency · engineVersions · calculationContextHash · business/market/settlement/payment/due dates · journal immutable facts · backup lineage · EXTERNAL_REPORTED vs calculated

---

## 10. Execution order after freeze

1. Documentation authority cleanup  
2. Schema/Field/FK freeze  
3. Golden fixture gate  
4. Core Money/Rounding/FX  
5. Accounting Core (Journal, Operation, Idempotency, Reversal)  
6. Cash Settlement Port + adapters  
7. Cost Basis + Valuation  
8. Reconciliation + Recovery  
9. Vertical #1 Accounts + Transactions  
10. Vertical #2 Loans  
11. Vertical #3 Crypto  
12. Vertical #4 Funds  
13. Vertical #5 Stocks Iran  
14. Vertical #6 Metals  
15. UI Shell (9 pages)  
16. Commercial capability gates  

---

## 11. Think-tank decision

> Do **not** add another P0 file. Clean authority → freeze schema/field graph → green golden fixtures → one vertical path API→Journal→Cash→Persist→Report. Then repeat the pattern.

Personal-FI is closer to a serious financial system than a simple budget app. Main risk is **documentation over-engineering / dual authority**, not missing features.

---

## 12. Evidence map

| Topic | Path |
|-------|------|
| Go/No-Go | `GO-NO-GO.md` |
| Doc hierarchy | `DOC-CONSOLIDATION-POLICY.md` |
| Operation core | `Canonical-Financial-Operation.md` |
| Calc invariants | `Accounting-Calculation-Invariants.md` |
| Field ownership | `Field-Level-Data-Ownership-Matrix.md` |
| Dictionary | `Data-Dictionary.md` |
| Relationships | `Relationship-Matrix.md` |
| Feature API | `Feature-API-Contract.md` |
| Independence | `Feature-Independence-Contract.md` |
| Schema tables | `db/01-schema-tables.md` |
| Freeze coverage | `db/SCHEMA-FREEZE-COVERAGE.md` |
| OPEN live | `OPEN-ISSUES-REGISTER.md` |
| IA | `docs/00-Product/Pages-IA.md` |
| Product map | `docs/Product-Map-FA.md` |
| Historical audit | `FINAL-THINK-TANK-AUDIT-2026-09-03.md` |
| CI | `.github/workflows/ci.yml` |
