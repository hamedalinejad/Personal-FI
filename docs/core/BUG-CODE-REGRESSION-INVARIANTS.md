# BUG-CODE-001…008 / P0-CODE-001…008 — Permanent regression invariants

**Status: CLOSED + regression lock only.** Do not list as OPEN product bugs.

Aliases: P0-CODE-001…005 ≡ BUG-CODE-001…005; P1-CODE-006…008 ≡ BUG-CODE-006…008.


These were confirmed historical failures. They are **not** open product bugs on the docs branch; they **must not be reintroduced**.

| ID | Permanent rule | Tests |
|----|----------------|-------|
| BUG-CODE-001 | Financial input → parse → finite check → canonicalize → persist | `src/core/money/canonicalDecimal.test.js` |
| BUG-CODE-002 | `feeCarrying = sourceCostReleased − destinationCarrying`; gross=net+fee | `src/core/costBasis/transferCost.test.js` |
| BUG-CODE-003 | gross>0; 0≤fee<gross; consideration>0; finite | `acquisitionFeeFromReceived.test.js` |
| BUG-CODE-004 | Dest cost from economic consideration, not market mark | `applyEconomicSwap.test.js` |
| BUG-CODE-005 | qty/price/FX finite and >0 for attribution inputs | `valuationAttribution.test.js` |
| BUG-CODE-006 | Fixture IDs exact string; not decimal-normalized | `fixtures/harness.test.js` |
| BUG-CODE-007 | Reject JSON number primitives in financial fixtures | `fixtures/harness.test.js` |
| BUG-CODE-008 | Every helper: golden + failure vectors | tests above include both |

Live code lives under `src/core/`. Re-run: `npm test` / `node --test src/**/*.test.js`.

## P0-CODE-001…005 runtime fixes 2026-09-08

| ID | Fix |
|----|-----|
| P0-CODE-001 | `toDecimal` → `canonicalDecimalString` only (no `String(number)`) |
| P0-CODE-002 | domain path = pure prepare before single `persistOperation` |
| P0-CODE-003 | recover from durable `operationId.json` before domain; commandHash in record |
| P0-CODE-004 | in-process mutex per operationId (pre-SQLite) |
| P0-CODE-005 | `stableStringify` sorted keys for commandHash |

Status: **CLOSED** in src; keep as regression lock.

## P0-CODE-006…012 2026-09-08

| ID | Status |
|----|--------|
| P0-CODE-006 | SQLite path via node:sqlite (default mode=sqlite); json prototype kept |
| P0-CODE-007 | Public status/durability_state vs internal _transportState |
| P0-CODE-008 | Gate expanded: fee conservation, qty conservation, immutable post |
| P0-CODE-009 | assertImmutablePost(previous, attempted) |
| P0-CODE-010 | parsePeriodCount strict integer |
| P0-CODE-011 | unsupported day counts rejected (period_based only v1) |
| P0-CODE-012 | applyFee validates amount + single allocation event |
