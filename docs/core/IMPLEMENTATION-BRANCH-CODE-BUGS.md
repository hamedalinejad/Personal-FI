# Implementation-branch code bugs (P0-CODE / P1-CODE)

**Not verifiable on main** — `src/` absent. Track for restoration on implementation branch.

| ID | Target (when src restored) | Fix |
|----|----------------------------|-----|
| P0-CODE-001 | canonicalDecimalString | reject non-finite/empty; normalize -0→0; input string-only |
| P0-CODE-002 | transferCost.ts | reject negative/zero invalid; feeCarrying = sourceReleased − destCarrying |
| P0-CODE-003 | acquisitionFeeFromReceived | gross>0, 0≤fee<gross, consideration>0, finite |
| P0-CODE-004 | applyEconomicSwap | non-negative finite carrying/fees; consideration > 0 |
| P0-CODE-005 | valuationAttribution | qty/price/FX finite and > 0 |
| P1-CODE-006 | fixtures harness assertExpected | exact string id compare, not decimal normalize |
| P1-CODE-007 | harness load | reject JSON numbers in money fields |
| P1-CODE-008 | acquisitionFee tests | explicit failure cases |

QA rule: none of these may be marked «verified fixed in current tree» until `src/` exists and tests pass.
