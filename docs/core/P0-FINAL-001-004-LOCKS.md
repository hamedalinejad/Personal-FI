# P0-FINAL-001 … 004 — Pre-code freeze critical locks

**Executive status:** NOT YET READY FOR CODING — near freeze; these four must be closed without dual interpretation.

---

## P0-FINAL-001 — ONE canonical cash SoT

### Decision (supersedes dual reading of P0-091)

```text
Canonical cash identity and balance SoT:
  fin_accounts + fin_journal_lines ONLY

Feature cash tables
  (inv_crypto_cash, brokerage cashBalance, metals platform cash, …):
  PROJECTION / metadata / integration view ONLY
  → must store finAccountId when integrated
  → balance field = DERIVED/SNAPSHOT, rebuildable from journal
```

Venue features **own business events** (deposits, trades, withdrawals) that **emit** journal lines via CashSettlementPort / operations. They do **not** own an independent balance SoT.

If a domain cash event log exists for reconcile against exchange statements, it is an **event source**, not a second balance authority.

### Acceptance

For one exchange account: two buys + one withdrawal → rebuild cash from journal **equals** projection rebuild; single number.

### Doc patches required

- `Canonical-Cash-Model.md` P0-091 section rewritten to this decision.
- Any “venue ledger = cash SoT” wording demoted to event/projection.

---

## P0-FINAL-002 — CostBasisEngine identity = instrumentId

```text
instrumentId  = ref_instruments.id   // ONLY canonical identity
assetKey      = provider/index convenience only
symbol        = label
```

CostBasisEvent, grouping, rebuild, API: **instrumentId** only.  
Table rows that said `identity=assetKey` are **wrong** and must read `identity=instrumentId`.

### Acceptance

Two instruments with same display symbol or colliding assetKey strings do not merge holdings/cost pools.

---

## P0-FINAL-003 — Canonical fee funding vocabulary

Replace ambiguous overload of “base” with independent dimensions:

```text
feeFundingAsset:     same_received_asset | separate_balance_same_asset | quote_asset | third_asset | external
feeFundingLocation:  holding | venue_cash | bank_cash | external | …
feeIncludedInReceivedQuantity: boolean  // true ⇒ gross received includes amount later burned as fee
```

### Legacy enum mapping (compatibility)

| Legacy feePresence | Canonical |
|--------------------|-----------|
| fee_from_received / fee_from_base_asset (qty burn on received) | same_received_asset + feeIncludedInReceivedQuantity=true |
| fee_in_quote | quote_asset |
| fee_external | external |
| (separate same-asset wallet burn) | separate_balance_same_asset |

### Truth table (minimum)

| Case | Holding Δ | Cash/quote Δ | Fee economic effect |
|------|-----------|--------------|---------------------|
| BUY 1 BTC, fee 0.001 BTC from received | +0.999 BTC | −quote for 1 BTC trade (per contract) | fee on 0.001 per treatment policy |
| BUY 1 BTC, fee in USDT quote | +1 BTC | −quote − fee USDT | fee in quote once |
| Transfer send 1, fee 0.001 from received at dest | src −1; dest +0.999 | — | fee burn policy |
| Fee third asset | trade qty full net policy | fee asset movement | third asset fee once |

Exact numbers: fixture `FEE-BUY-BTC-001` (see below).

---

## P0-FINAL-004 — Fee burn accounting closed form

When quantity is burned as fee (network fee / same-asset fee):

### Required effects (each treatment policy must define all five)

```text
feeQuantityEffect      // Δ holding qty
feeCostBaseEffect      // change to cost pool
feePnLEffect           // realized/expense recognition
feeJournalEffect       // accounts debited/credited
feeWealthEffect        // Δ net wealth
```

### Canonical v1 policies (pick per feeFunding + product; default for crypto network burn)

**Policy `expense_at_fair_value` (default network fee burn v1):**

```text
feeQuantityEffect = −feeQty
feeCostBaseEffect = reduce cost pool by average cost of feeQty
                    (releasedCost = feeQty × avgCost)
feePnLEffect      = fairValueBase(feeQty) − releasedCost
                    // if FV accounting: expense fair value and adjust;
                    // v1 simplified: expense = releasedCost (no separate FV gain on burn)
                    // LOCKED v1: feePnLEffect = expense of releasedCost in base
                    //            (no extra FV income on burn)
feeJournalEffect  = Dr Fee expense (base) / Cr Asset (carrying of feeQty)
feeWealthEffect   = −fairValueBase(feeQty) approximately via lower asset qty;
                    book path follows carrying release + expense
```

**v1 LOCK for crypto network/same-asset burn:**

```text
releasedCost = feeQty × avgCostBeforeBurn
holding qty -= feeQty
totalInvested -= releasedCost
fee expense (base) += convert(releasedCost)   // economic P&L hit = carrying released
// Do NOT also mark FV gain/loss on the burned qty in v1
// Do NOT leave cost pool unchanged while only cutting qty (that would inflate avg)
```

**Policy `add_to_acquisition_cost` (only when fee is acquisition-related and treatment says so):**

```text
fee increases cost of acquired net qty (quote or third-asset fee capitalized)
not used for pure network burn of transferred dust without acquisition
```

### Acceptance fixture sketch `FEE-BURN-BTC-IRR`

```text
Before: qty=1.0 BTC, totalInvested=100_000_000 IRR, avg=100_000_000
Burn: 0.001 BTC network fee
After: qty=0.999, totalInvested=99_900_000, expense=100_000 IRR
Wealth: asset mark uses 0.999; expense recognized 100_000 book
```

(With marks/FX: still one fee economic effect — X-011.)

---

## Fixture FEE-BUY-BTC-001 (P0-FINAL-003 acceptance)

```text
BUY grossQuantity=1 BTC
feeFundingAsset=same_received_asset
feeQuantity=0.001 BTC
netQuantity=0.999 BTC
quote payment for gross 1 BTC at trade price (command)
cost basis allocated to 0.999 net per CostBasisEngine
  (fee qty 0.001: under v1 burn policy expense released cost of 0.001
   OR if acquisition fee_from_received policy capitalizes — document in op;
   DEFAULT buy fee_from_received: net holding 0.999; cost pool = quote spent
   allocated to 0.999; burned 0.001 does not carry separate cost slice
   beyond reducing qty with cost on net only — see Cost-Basis feePresence matrix)
```

Explicit default for **spot BUY with fee from received asset**:

```text
holding += netQuantity
totalInvested += quotePaidBase + quoteFeeBase (if any)
// feeQuantity reduces gross to net; cost applies to net units only
// no second cash leg for BTC fee
```

---

## Status

| ID | Status |
|----|--------|
| P0-FINAL-001 | **LOCKED** — one cash SoT |
| P0-FINAL-002 | **LOCKED** — instrumentId only in CostBasis |
| P0-FINAL-003 | **LOCKED** — fee funding vocabulary + truth table |
| P0-FINAL-004 | **LOCKED** — v1 fee burn closed form |

Overall coding readiness remains **near freeze** until golden fixture pack is mostly numeric-green; these four remove dual interpretation on cash, identity, fee presence, and fee burn.
