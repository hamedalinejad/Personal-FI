# REPORTING (sole reports owner)

**Status:** CURRENT

Absorbs: Essential-Reports, Reports-Analytics, investment/valuation/as-of prose.

## Reports
GL · TB · BS · IS · CF · Account activity · Net Worth · Investment performance · Historical as-of.

## Cash / NW
Journal-derived only. `rpt_*` snapshots must reconcile. Never `rep_*`.

## Historical pipeline
ledger cutoff → CA → cost basis → settlement cutoff → price as-of → FX as-of → valuation → payload.

## Valuation context
asOf, priceAsOf, fxAsOf, engineVersions, staleStatus.

## Aggregation
Decimal / sumDecimalStrings only.

## Acceptance
TB balances; NW cash matches journal; historical includes valuation context.

## Release
Full golden suite PARTIAL until RELEASE_PROVEN.


## Investment performance definitions
- **Realized P&L:** from disposal operations (cost basis vs proceeds − fees) in base.
- **Unrealized P&L:** valuation(asOf) − cost basis; uses priceAsOf + fxAsOf context; never rewrites cost.
- **Fees / FX gain:** separate attribution lines when reported.
- Cash flows for TWR/MWR: explicit dated external flows only; formulas versioned in engineVersions.
