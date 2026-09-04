# BUG-CODE-001…008 — Permanent regression invariants

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
