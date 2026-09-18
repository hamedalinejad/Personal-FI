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

## Posted-only boundary (LOCKED)
All standard statements (GL, TB, BS, IS, CF, account activity) read **posted** journal lines only via a shared reader.  
Voided/reversal rows appear only in explicit audit/history modes.  
Cash classification from `fin_accounts`; never from feature cash snapshot tables as Net Worth SoT.

## Report inventory (LOCKED)

Derived only — never a second ledger.

| Report | Source | v1 |
|--------|--------|-----|
| General Ledger | posted journal | required |
| Trial Balance | posted journal | required |
| Balance Sheet | posted journal + classification | required |
| Income Statement | posted journal | required |
| Cash Flow | posted journal + cash accounts | required |
| Account Activity | posted journal filtered | required |
| Net Worth | journal cash + valuations | required |
| Investment P&L | disposals + valuation context | required |
| Historical asOf | ledger cutoff + price/FX asOf | required |
| Fees attribution | fee events / journal line_kind | required |
| Allocation | classification | required |

### Investment performance definitions (versioned)
| Metric | Definition |
|--------|------------|
| Realized P&L | disposal: proceeds − cost released − allocated fees (base) |
| Unrealized P&L | valuation(asOf) − carrying; uses priceAsOf + fxAsOf; never rewrites cost |
| FX gain/loss | separate when multi-currency settlement/valuation |
| Fee attribution | by treatment and period |
| TWR | **DEFERRED** for v1 unless engineVersions ship a locked formula |
| MWR / IRR | **DEFERRED** for v1 unless engineVersions ship a locked formula |

Registry must keep TWR/MWR as DEFERRED until formulas + fixtures exist — do not imply completeness from report names alone.

## Performance metrics scope (LOCKED)
v1: realized P&L · unrealized P&L · FX attribution · fee attribution.  
**TWR / MWR / IRR = DEFERRED** until formulas + fixtures locked.  
Report name alone does not imply metric support.

Standard statements consume **posted** journal only; voids/reversals in explicit audit/history views.

## TWR / MWR contract status (DEFERRED until formulas locked)
Before implementing investment performance algorithms, lock in this document:
```
TWR formula · MWR/IRR formula · cash-flow timing · valuation timestamps
FX conversion point · fees treatment · deposits/withdrawals · income/distributions
unrealized valuation · asOf
```
Until locked: do not ship ambiguous return metrics. v1 remains realized/unrealized P&L + fee/FX attribution only.

## TWR / MWR / IRR — DECISION LOCK (v1)

**Status: DEFERRED** — do not implement an investment-return algorithm until formulas below are un-deferred with fixtures.

| Topic | v1 rule |
|-------|---------|
| TWR | DEFERRED — formula + cash-flow timing + fixtures required before coding |
| MWR / IRR | DEFERRED — same |
| Cash-flow timing | Must be defined with each formula (trade vs settle vs cash date) |
| Valuation timestamps | `priceAsOf` + `fxAsOf` required; never “latest now” |
| FX conversion point | Book base via pinned rate context only |
| Fees | Follow Fee taxonomy; attribution deferred with TWR/MWR |
| Deposits/withdrawals | External flows only when formula defines inclusion |
| Income/distributions | Separate from price return until formula locks |
| Unrealized | Valuation snapshot; not journal rewrite |
| asOf | Required parameter on historical reports |

**Allowed v1 reporting:** GL, Trial Balance, BS, IS, CF (posted-only), account activity, holdings cost, realized P&L from disposal operations when domain defines it.

**Forbidden:** inventing TWR/MWR “for completeness” without this section being un-deferred + golden fixtures.


## v1 report list (LOCKED)
GL · Trial Balance · BS · IS · CF · Account Activity · Holdings/Cost · Realized P&L · Unrealized P&L · Fee attribution  

**DEFERRED:** TWR · MWR/IRR · Performance FX attribution  

FX conversion context for asOf valuation ≠ released FX performance attribution metric.
