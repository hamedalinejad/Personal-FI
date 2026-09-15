# PRODUCT (sole product owner)

**Status:** CURRENT · **Class:** CURRENT

Sole product authority. Absorbs PRODUCT/FA, Project-Blueprint product sections, Pages-IA navigation rules.


**Repo state:** reference implementation scaffold under specification authority — production **NO-GO** until RELEASE_PROVEN.
## 1. Vision
Build an **offline-first** personal finance application for individuals: accurate double-entry accounting, Iran-aware market rules, and **licensable feature editions** (loan-only, crypto-only, etc.) on the same Financial Core.

## 2. Target users
Individuals and households tracking:
cash & bank accounts · income/expense · cheques · loans · crypto · Iran stocks · funds · metals · physical assets · budgets/goals/bills · tax notes · documents.

Not target: enterprise multi-entity ERP, broker OMS, HFT, cloud-primary multi-tenant SaaS.

## 3. Product principles
1. **Accounting Core always present** — even when UI hides it in standalone editions.
2. **Feature ≠ Page** — features are packages; navigation is a small IA.
3. **Journal is cash truth** — no parallel feature cash ledgers as SoT.
4. **Decimal-string money** — no IEEE float for money/qty/rates.
5. **License gates capability only** — never deletes or corrupts history.
6. **One owner document per concept** — see DEVELOPMENT.md / DEVELOPMENT.md.
7. **Offline-first** — network enhances prices/FX/import; correctness does not depend on live APIs.

## 4. Scope v1
| Area | In scope |
|------|----------|
| Money | Accounts, transfers, deposit/withdrawal, multi-currency display (IRR storage) |
| Cashflow | Income, expense, categories |
| Instruments | Cheques, loans (v1 methods locked in modules/loan.md) |
| Investments | Crypto, Stocks Iran, Funds, Metals |
| Assets | Physical assets (basic) |
| Planning | Budget, goals, bills (planning only — not cash SoT) |
| Tax | Tax events/records (obligation tracking; not full tax authority filing product) |
| Ops | Reports, dashboard, portfolio, documents, settings, security, price observations |

## 5. Explicit exclusions (v1)
Enterprise multi-entity · cloud as primary truth · futures/options/DeFi/NFT · hard-coded Iran official rates inside Core (use versioned policy packages) · guaranteed sub-second market data · multi-user concurrent accounting on one DB without writer lock.

## 6. Editions / licensing
| Edition | Surfaces |
|---------|----------|
| Loan-only | Loan UI + Core journal (hidden) + export/backup |
| Crypto-only | Crypto + Core |
| Stocks-only | Stocks Iran + Core |
| Funds-only | Funds + Core |
| Metals-only | Metals + Core |
| Full | All licensed modules |

**Downgrade:** hide/disable commands; **retain** all rows, export, and rebuild.

## 7. Navigation (locked — max 6 top-level)
| Route | Role |
|-------|------|
| `/` | Home / dashboard summaries |
| `/money` | Accounts & cash surfaces |
| `/transactions` | Cross-cutting activity |
| `/investments` | Crypto/stocks/funds/metals |
| `/loans` | Debt & loan |
| `/more` | Tax, documents, settings, security, planning |

Sheets/drawers for create/edit. **No** top-level `/accounting` page.

## 8. Page vs feature
- **Feature** = domain package (`src/features/*`) with public API.
- **Page** = UI composition that may call one or more feature public APIs.
- UI never opens SQLite or invents journal lines.

## 9. UX philosophy
Minimal navigation · context-heavy sheets · decimal-safe inputs · Jalali **display** allowed; storage dates ISO · Toman is **display unit** only (ledger currency IRR).

## 10. Standalone behavior
See **Standalone editions (LOCKED)** below.


## 11. Offline philosophy
Node: SQLite file. Browser: persistence port → sql.js + IndexedDB (see OFFLINE-RELEASE.md). Durable ACK after publish. Single-writer multi-tab.

## 12. Import/export philosophy
Preserve raw lineage (`import_batches`, provenance fields). No silent field drop. Unknown source fields retained in payload JSON when policy says so.

## 13. Release boundaries
**Production = NO-GO** until edition claims meet RELEASE_PROVEN (golden + recovery + standalone + CI) per OFFLINE-RELEASE.md and QUALITY-STATUS.md.

## 14. Terminology
Product UX labels may be localized. Canonical technical terms live in FINANCIAL-CORE, DATA-MODEL, API — modules must not invent parallel vocabularies.

## 15. Supersedes (MERGE complete for product prose)
- `docs/PRODUCT.md` / `PRODUCT.md` → pointers only
- `docs/PRODUCT.md` product sections
- `docs/00-Product/Pages-IA.md` nav rules (if present)

## 16. Non-product owners
Architecture → ARCHITECTURE.md · Finance math → FINANCIAL-CORE.md · Schema/fields → DATA-MODEL.md · HTTP/API → API.md · Reports → REPORTING.md


## 17. Module index
| Module | Path |
|--------|------|
| Accounts | modules/accounts.md |
| Income/Expense | modules/income-expense.md |
| Cheque | modules/cheque.md |
| Loan | modules/loan.md |
| Crypto | modules/crypto.md |
| Stocks Iran | modules/stocks.md |
| Funds | modules/funds.md |
| Metals | modules/metals.md |
| Physical assets | modules/physical-assets.md |
| Budget/Goals/Bills | modules/budget-goals-bills.md |
| Tax | modules/tax.md |


## 18. Edition capability matrix
| Edition | Modules enabled |
|---------|-----------------|
| Loan-only | loan + core settlement |
| Crypto-only | crypto + core |
| Stocks-only | stocks + core |
| Funds-only | funds + core |
| Metals-only | metals + core |
| Full | all modules licensed |

Disabled modules: commands return capability error; data remains.

## 19. UX glossary (labels only)
| UX label | Canonical |
|----------|-----------|
| Toman display | IRR/10 presentation |
| Wallet | operational account or crypto wallet entity |
| Portfolio | report/projection, not cash SoT |

## 20. Backup product requirement
User-accessible backup/restore from Settings; restore replaces DB file via persistence port; post-restore integrity check.

## IA — six routes (LOCKED)
```
/              HOME — dashboard, net worth, cash, recent
/money         accounts, transfers, income/expense, cheques
/transactions  unified activity, filters, journal detail
/investments   crypto, stocks, funds, metals, portfolio
/loans         loans, schedule, payments
/more          tax, assets, budget/goals/bills, documents, settings, backup
```
Create/Edit = drawer / sheet / modal / short wizard — **not** a new top-level page.

## Standalone editions (LOCKED)

Editions:
```
Loan-only · Crypto-only · Stocks-only · Funds-only · Metals-only · Full
```

### Shared kernel (always present, even if UI hidden)
```
Decimal · FX · Fee Engine · Journal · Operation engine · Recovery · Persistence port
```
No edition ships a second accounting kernel or cash ledger.

### Licensing
Controls only: capability · command availability · UI surfaces.  
**Never deletes history** on downgrade.

### Edition matrix — what the user can do without Accounts UI

| Edition | Boot | Core journal | Local settlement | Representative ops | Statements | Backup/restore |
|---------|------|--------------|------------------|--------------------|------------|----------------|
| Loan-only | yes | yes (hidden) | yes | create, pay, reverse, schedule | loan statement + TB subset | yes |
| Crypto-only | yes | yes (hidden) | yes | buy, sell, transfer | holdings + P&L + TB subset | yes |
| Stocks-only | yes | yes (hidden) | yes | buy, sell, settle, dividend | positions + TB subset | yes |
| Funds-only | yes | yes (hidden) | yes | subscribe, redeem, distribute | holdings + TB subset | yes |
| Metals-only | yes | yes (hidden) | yes | buy, sell, delivery | holdings + TB subset | yes |
| Full | yes | yes | full Accounts UI | all | full REPORTING set | yes |

**Rule:** Standalone never imports another feature’s internals. Settlement uses `CashSettlementPort` + `ensureLocalSettlementAccounts` only.

### Acceptance pattern (STANDALONE_GREEN)
```
boot → create entity → representative operation → statement
  → export → backup → restore → rebuild → verify same result
```

## Six routes (LOCKED) — Feature ≠ Page
```
/ · /money · /transactions · /investments · /loans · /more
```
Sheets/drawers under these routes only. No route per table or per feature package.

## Accounting stance
Financial truth rules and **forbidden anti-patterns** live only in [FINANCIAL-CORE.md](./FINANCIAL-CORE.md).  
Modules must not invent a second cash or cost ledger.

## STANDALONE_GREEN meaning (LOCKED)
Not merely `standalone.test.js` existence. Full path must pass:
```
boot → create entity → representative operation → statement
→ export → backup → restore → rebuild → same result
```

## Licensing control plane (LOCKED)
License gates **capabilities and UI only** — never journal semantics, never history deletion.  
Downgrade: capability unavailable; historical data remains readable/exportable.  

Before RELEASE of license enforcement define (in PRODUCT + machine registry, not new MD files):
```
edition ID · capabilities · entitlement · local validation
offline grace (if any) · upgrade · downgrade · expiry behavior
historical readability · backup compatibility
```

## What not to simplify (LOCKED)
Keep economically necessary distinctions:
```
tradeDate ≠ settlementDate · NAV ≠ transactionPrice · IRR ≠ Toman display
feeAmount ≠ feeQuantity · book base ≠ transaction currency
business status ≠ durability · instrument id ≠ symbol
holding ≠ accounting SoT · premium ≠ fee · delivery fee ≠ trade fee
tax obligation ≠ paid · posted ≠ draft
```
Simplify via UI: smart defaults, guided sheets, progressive disclosure, unified activity — **not** by collapsing Core distinctions.

## Minimal UI (LOCKED) — six routes only
| Route | Surfaces |
|-------|----------|
| `/` | net worth · cash · investments · loans · activity · warnings |
| `/money` | accounts · transfers · income · expense · cheques |
| `/transactions` | unified events · filters · operation/journal · reversal |
| `/investments` | crypto · stocks · funds · metals · portfolio (tabs/sheets) |
| `/loans` | loans · schedule · payments · statement |
| `/more` | tax · assets · budget/goals/bills · documents · settings · backup · security · license |

No route per entity, table, report, or feature package.
