# REPORTING (sole reports owner)

**Status:** CURRENT

## 1. Report set
GL · Trial Balance · Balance Sheet · Income Statement · Cash Flow · Account activity · Net Worth · Investment performance · Historical as-of valuation.

## 2. Cash / Net Worth SoT
**Cash and NW cash legs derive from Core journal only.**  
`rpt_*` snapshots may accelerate; must reconcile to journal. Never `rep_*` prefix.

## 3. Historical as-of order (locked)
```
ledger cutoff → corporate actions → cost basis rebuild → settlement cutoff
→ price selection → FX selection → valuation → report
```

## 4. Valuation context (required on historical results)
`asOf` · `priceAsOf` · `fxAsOf` · `engineVersions` · `staleStatus`

## 5. Tables
`rpt_presets` · `rpt_snapshots` · `rpt_net_worth_snapshots` only.

## 6. Release
Full BS/IS/CF golden suite: **PARTIAL** until RELEASE_PROVEN (QUALITY-STATUS).

## 7. Supersedes
Reports-Analytics feature prose as secondary; Essential-Reports absorbed here.
