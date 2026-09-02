# Crypto Feature Locks CR-001 … CR-015 (P0)

در تعارض با prose قدیمی همان Feature، این سند برنده است. هم‌راستا با X-003 identity و CostBasisEngine.

---

## CR-001 — Identity

- Canonical: `instrumentId` = `ref_instruments.id` (UUID FK).
- `assetKey` = derived mapping / convenience index only — not identity for PK, rebuild, or unique business key alone.
- `symbol` = label only.

---

## CR-002 — Quantity semantics

Always when fee may apply:

| Field | Meaning |
|-------|---------|
| `grossQuantity` | before same-asset fee |
| `feeQuantity` | amount of asset taken as fee (if any) |
| `netQuantity` | effect on holding |

Holding updates use **net** effects only. Alias `quantity` = net for compatibility; do not invent a third meaning.

---

## CR-003 — BUY fee presence

| feePresence | holding delta on buy of 1 gross |
|-------------|----------------------------------|
| `fee_from_base_asset` | net = 0.999 if feeQuantity=0.001 |
| `fee_in_quote` | net = 1 (fee paid in quote; no qty burn) |

Texts that claim both “holding=1” and “holding=0.999” without feePresence are invalid.

---

## CR-004 — C2C BUY leg quantities

C2C destination (buy) leg must expose:

```text
grossReceived
feeQuantity   // if fee_from_received / base asset on dest
netReceived   // holding += netReceived
```

Ambiguous single `quantity` on C2C buy leg without gross/net is forbidden.

---

## CR-005 — C2C destination cost (P0-010 LOCKED)

**Canonical:**
```text
economic_trade_or_swap → destination basis = trade consideration (+ capitalized fees)
internal_transfer | same_owner_bridge → transferred / carrying cost
```
Any formula `destinationCost = costReleasedFromSource` applies **only** to transfer/bridge, **not** economic C2C.

## CR-005 — (legacy section retained for history; rules above win)

```text
transferredCost = costReleasedFromSource  // from CostBasisEngine on sell/disposal leg
destinationCost = transferredCost + allocatedAcquisitionFees
```

**Forbidden:** setting destination cost from current market value of received asset.

---

## CR-006 — Rebuild key

```text
rebuildHolding(holdingId)
// or rebuild by (location keys + instrumentId)
```

**Forbidden:** rebuild filter primarily by `assetKey` or `symbol` as identity.

---

## CR-007 — totalFeesPaidBase vs reverse

| Metric | Meaning |
|--------|---------|
| `effectiveFeesBase` | fees on **active** (non-reversed) ops contributing to holding economics |
| lifetime / audit fee total | optional separate posted-including-reversed metric |

After reverse, effective fees must drop; do not keep reversed fees inside the same “totalFeesPaidBase” used for live holding economics without documenting two metrics.

---

## CR-008 — Network fee / fee_from_received

- One **CanonicalFeeEvent** per economic fee.
- Same-asset mode invariant: `grossQuantity = netQuantity + feeQuantity` (when fee from that asset).
- Must not subtract fee twice (once in qty path and again as full cash fee of same economic amount without treatment split).

---

## CR-009 — Price provider not blocking

- Trade **correctness** uses prices from the **command** (user/import).
- Price API = suggestion + valuation only.
- Offline / provider down must not block posting a trade with explicit trade price.

---

## CR-010 — Internal transfer

```text
transfer_out + transfer_in
cost carries; realizedPnl = 0
```

**Forbidden:** modeling pure internal transfer as sell+buy pair that realizes P&L.

---

## CR-011 — Bridge (e.g. ERC20 → TRC20)

Not a simple same-instrument transfer:

```text
bridge operation
  sourceInstrumentId → targetInstrumentId
  transferred cost basis policy
  fee burn / bridge fee explicit
```

Two instruments remain distinct identities (CR-001).

---

## CR-012 — External receive cost basis

Inbound without prior inventory **must** set explicit policy:

| Policy | Effect |
|--------|--------|
| `user_provided_cost` | user/import cost |
| `fair_value_at_receipt` | mark at receipt (income/gain policy documented) |
| `zero_basis` | explicit; future sale may show full proceeds as gain |

Silent null cost that later invents market cost = forbidden.

---

## CR-013 — economicKind

`airdrop` | `gift` | `staking_reward` | `other_reward` | … each with independent **cost basis + income recognition** policy (not all treated as free zero-basis without declaration).

---

## CR-014 — Fee in third asset

When fee asset ∉ {base asset of trade, quote}:

- `feeInstrumentId` required
- historical price/FX to book fee in cost currency / base
- journal/fee event once (X-011)

---

## CR-015 — Acquisition lots / FIFO readiness

Preserve on acquisition legs (even if v1 method is weighted average):

```text
acquiredAt / businessDate
operationId
gross/net quantities
cost components
```

Raw lot identity must not be discarded solely because current method is WA.

---

## Status

| ID | Status |
|----|--------|
| CR-001 … CR-015 | **LOCKED** 2026-09-02 |

## P0-FINAL fee vocabulary

feePresence legacy maps to feeFundingAsset table in `docs/core/P0-FINAL-001-004-LOCKS.md`. Burn math: P0-FINAL-004.

## P0-FINAL-012 / 013 / 014

C2C = economic_trade_or_swap (realized). Bridge/transfer realized=0. EconomicKind matrix + opening equity journals: `docs/core/P0-FINAL-011-014-LOCKS.md`.

---

## CR-005 / C2C — SUPERSEDED BY CORE LOCK

Any CR-005 text that sets C2C destination cost = source carrying cost is **void**.

Use `economicKind` + `P0-COST-BASIS-PNL-001-005-LOCK.md`:
- trade/swap → consideration-based dest cost + source realized
- transfer/bridge → carry cost only
