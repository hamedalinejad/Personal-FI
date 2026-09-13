# PRODUCT (sole product owner)

**Status:** CURRENT · **Class:** CURRENT

Sole product authority. Absorbs Product-Map-EN/FA, Project-Blueprint product sections, Pages-IA navigation rules.

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
6. **One owner document per concept** — see DOCUMENTATION-STANDARD.md / DEVELOPMENT.md.
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
Standalone edition boots **without** Accounts UI and **without** importing other feature internals. Uses `CashSettlementPort` + local settlement accounts. Journal remains SoT. Export/report/backup required for RELEASE_PROVEN of that edition.

## 11. Offline philosophy
Node: SQLite file. Browser: persistence port → sql.js + IndexedDB (see OFFLINE-RELEASE.md). Durable ACK after publish. Single-writer multi-tab.

## 12. Import/export philosophy
Preserve raw lineage (`import_batches`, provenance fields). No silent field drop. Unknown source fields retained in payload JSON when policy says so.

## 13. Release boundaries
**Production = NO-GO** until edition claims meet RELEASE_PROVEN (golden + recovery + standalone + CI) per OFFLINE-RELEASE.md and QUALITY-STATUS.md.

## 14. Terminology
Product UX labels may be localized. Canonical technical terms live in FINANCIAL-CORE, DATA-MODEL, API — modules must not invent parallel vocabularies.

## 15. Supersedes (MERGE complete for product prose)
- `docs/Product-Map-EN.md` / `Product-Map-FA.md` → pointers only
- `docs/Project-Blueprint.md` product sections
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
