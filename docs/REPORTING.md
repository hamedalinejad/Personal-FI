# REPORTING (sole reports owner)

**Status:** CURRENT

## 1. Report catalog
| Report | SoT inputs |
|--------|------------|
| General Ledger | fin_journal_lines + entries |
| Trial Balance | journal aggregated by account |
| Balance Sheet | TB + account class |
| Income Statement | income/expense classes |
| Cash Flow | journal cash accounts + classification |
| Account activity | journal filtered by account |
| Net Worth | assets − liabilities from journal + valuations |
| Investment performance | holdings rebuild + prices + FX as-of |
| Historical as-of | ordered pipeline below |

## 2. Cash / NW rule
**Cash is derived from Core journal only.** Snapshots (`rpt_*`) must reconcile.

## 3. Historical as-of pipeline
```
ledger cutoff → CA apply → cost basis rebuild → settlement cutoff
→ price as-of → FX as-of → valuation → report payload
```

## 4. Valuation context (mandatory)
`asOf`, `priceAsOf`, `fxAsOf`, `engineVersions`, `staleStatus`

## 5. Tables
`rpt_presets`, `rpt_snapshots`, `rpt_net_worth_snapshots` — never `rep_*`.

## 6. Aggregation
Use Core `sumDecimalStrings` / Decimal only — no SQL SUM on money TEXT without Decimal path.

## 7. Release
BS/IS/CF full golden suite PARTIAL until RELEASE_PROVEN (QUALITY-STATUS).

## Acceptance
- Trial balance debits = credits in base Decimal
- NW cash legs match journal cash accounts
- Historical report includes valuation context object

## Trial Balance algorithm
For each fin_account: sum Decimal amount_in_base by side; pair debit/credit totals; imbalance → report error not silent fix.

## Investment performance inputs
Holdings rebuild + cost basis engine version + price_history as-of + FX as-of + fee history.
