# REPORTING (sole reporting/valuation owner)

**Status:** CURRENT

## 1. Accounting set
GL · Trial Balance · Balance Sheet · Income Statement · Cash Flow · Account activity · Opening · Reconciliation  
All derived from **journal SoT**.

## 2. Book base
TB/BS use one bookBaseCurrency (arg or `db_meta.book_base_currency`). Mixed operation bases without filter → reject.

## 3. Investment set
Holdings · cost basis · realized/unrealized P&L · fees · external flows · wealth bridge.  
External contribution ≠ P&L.

## 4. Valuation
Prices are typed objects (price, currency, quoteType, marketDate, source…).  
Historical pipeline order (locked): ledger cutoff → CA cutoff → cost rebuild → settlement cutoff → price → FX → valuation → report.

## 5. Cash in reports
Journal only — not platform/brokerage cash caches.
