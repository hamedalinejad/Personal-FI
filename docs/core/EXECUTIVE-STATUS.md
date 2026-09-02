# Executive status — coding readiness

**STATUS: NOT YET READY FOR CODING** — near SPEC freeze.

## Closed dual-interpretation risks (must remain locked)

| ID | Topic |
|----|--------|
| P0-FINAL-001 | Single cash SoT = fin_accounts + journal |
| P0-FINAL-002 | CostBasis identity = instrumentId only |
| P0-FINAL-003 | Fee funding vocabulary + truth table |
| P0-FINAL-004 | Fee burn closed-form v1 |

Authority: `P0-FINAL-001-004-LOCKS.md`

## Still blocking full freeze

1. Golden fixture pack mostly inventory — need numeric expected domain/journal/cash/holding/P&L beyond the one crypto FX golden.
2. Multi-hop / multi-trade FX attribution algorithm further formalization for all paths (beyond single-lot golden).
3. Per-Feature P1 field matrices / reverse plans completion.

## When READY FOR CODING

- P0-FINAL-001…004 remain uncontradicted in all Core docs  
- Acceptance matrix §28 in `P1-IRAN-PERFORMANCE-FIXTURES-ACCEPTANCE.md` for scoped release  
- Critical path fixtures green (Core + scoped Features)

## P0-FINAL-005…010 (LOCKED)

Deterministic attribution v1 · FX path composition · price/FX no-observation policies · T+n settlement journals · dividend journal dates.

Still not full coding green until numeric fixture pack expands; **these algorithms are no longer optional prose**.

## P0-FINAL-011…014 (LOCKED)

CA golden numbers · transfer/bridge/swap split · EconomicKind journals · opening equity (not fake buy).


## P0-FINAL-015…020 (LOCKED)

Immutability delete/update · Kind enum + SYSTEM_INDEX · fee currency vs instrument · holding partial unique · acc_tx vs journal.
