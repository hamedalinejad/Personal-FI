# Status Semantics — sole definitions

| Label | Meaning | When GREEN is allowed |
|-------|---------|------------------------|
| **SPECIFIED** | Contract written | docs only |
| **PARTIAL** | Code/path exists, but not full contract + not all proofs | never claim release |
| **IMPLEMENTED** | Happy path code exists | still needs Golden/Recovery |
| **RELEASE-PROVEN** | Full matrix: unit + golden + recovery + standalone + CI evidence | only when evidence bundle computed |

## Why PARTIAL is not GREEN

PARTIAL means **at least one** of:

1. **Surface incomplete** — e.g. crypto has buy/sell/transfer but not full swap/airdrop/deposit set required by R-M08.
2. **Semantics incomplete** — e.g. loan day-count fields exist in schema but engine only runs `period_based`.
3. **Proof incomplete** — code path works in a few tests, but Golden/Recovery/Standalone matrices are not closed.
4. **Edition incomplete** — feature works inside full app but Loan-only / Crypto-only boot+export not proven.

**Production remains NO-GO** while any P0 gap is OPEN or PARTIAL without explicit DEFER in the release matrix.

Coding under CODING-GATE is allowed for Core/Loan vertical without claiming RELEASE-PROVEN.
