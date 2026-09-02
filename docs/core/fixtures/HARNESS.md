# Fixture Harness Contract (P0-FINAL-018)

## Requirement
Scoped release goldens must be **executable** and **green** before Gate C.

## Rules
- Inputs and expected financial values are **decimal strings**
- Compare with string equality after Canonical Decimal normalize
- One command: e.g. `pnpm test:fixtures` (when source exists) runs all scoped IDs
- Fail on missing expected field or non-string money

## Scoped minimum (must be green)
Core: INCOME, EXPENSE, TRANSFER, REVERSAL, CORRECTION, FEE, MULTI-CURRENCY  
Crypto: FX gain, FX opposite, quote fee, same-asset acq fee, internal transfer, network fee burn, C2C swap, bridge, external gift, opening

**Current:** SPEC_READY skeletons in `GOLDEN-*.md`. Numeric fill + harness implementation = Gate C work — **not** claimed green until CI exists.

## CODING-GATE clarification
Gate C text “implemented and green” applies **only after** harness exists. Until then Gate C = **BLOCKED**.
