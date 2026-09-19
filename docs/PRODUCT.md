# PRODUCT (sole product owner)

**Status:** CURRENT  
**Repo:** specification-locked reference scaffold · PRODUCTION = NO-GO until RELEASE_PROVEN

## 1. Vision
Offline-first personal finance: double-entry accounting, Iran-aware markets, licensable editions (loan-only, crypto-only, …) on **one** Financial Core.

## 2. Users & non-goals
**Users:** individuals/households — cash, I/E, cheques, loans, crypto, Iran stocks, funds, metals, physical assets, budget/goals/bills, tax notes, documents.  
**Not:** enterprise multi-entity ERP, broker OMS, HFT, cloud-primary multi-tenant SaaS.

## 3. Principles
1. Accounting Core always present (even when UI hides it).  
2. **Feature ≠ Page** — packages ≠ top-level routes.  
3. Journal = cash truth.  
4. Decimal-string money.  
5. License = capability only (never deletes history).  
6. One owner doc per concept.  
7. Offline-first correctness.

## 4. Scope v1
Money · cashflow · cheques/loans · investments (crypto/stocks/funds/metals) · physical assets · planning · tax notes · reports/documents/settings.  
**Out:** multi-entity ERP, hard-coded official rates in Core (use versioned policy packages), DeFi/NFT/options.

## 5. Navigation — six routes only (LOCKED)
```
/  /money  /transactions  /investments  /loans  /more
```
Create/edit = sheets/drawers/modals — **not** new top-level routes.  
Do not add `/crypto`, `/stocks`, `/accounting`, `/journal`, …

### Phase 10 shell mapping
Reports, planning, settings, backup, import live under **`/more/*`** sheets — not extra top-level routes.


## 6. Standalone editions (LOCKED)
| Edition | Surface |
|---------|---------|
| Loan-only | Loan UI + Core (hidden) + export/backup |
| Crypto-only | Crypto + Core |
| Stocks-only | Stocks + Core |
| Funds-only | Funds + Core |
| Metals-only | Metals + Core |
| Full | Licensed APIs via `publicRegistry` only |

```
Same Financial Core + one feature public-api + local settlement + feature reports
```
User **never** must open Accounts UI. **Never** a second cash ledger.  
Acceptance: `boot → create → op → statement → export → backup → restore → rebuild → same result`.

## 7. Licensing (LOCKED)
Gates **capability + UI** only. Downgrade leaves history readable/exportable.  
Machine: `docs/core/registry/license-editions.json`.

## 8. What not to simplify
```
tradeDate ≠ settlementDate · NAV ≠ transactionPrice · IRR ≠ Toman display
feeAmount ≠ feeQuantity · book base ≠ transaction currency
business status ≠ durability · instrument id ≠ symbol
holding ≠ accounting SoT · trade fee ≠ delivery fee · tax obligation ≠ paid
```
UI may guide; Core distinctions stay.

## 9. Module index
See `docs/modules/*.md` — 11 modules. Shared finance rules → FINANCIAL-CORE only.

## 10. Coding readiness
Owner surface fixed: global owners + modules + machine core.  
Scaffold maintenance allowed; **production coding after FREEZE_PROVEN**. UI last.
