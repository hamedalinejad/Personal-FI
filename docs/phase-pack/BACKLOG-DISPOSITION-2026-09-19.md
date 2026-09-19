# Backlog disposition vs main @ 9fc299d

Authority: code + tests + registries on `main`.  
Do not treat branch-audit OPEN flags as live if closed below.

| ID | Audit severity | Live disposition | Evidence |
|----|----------------|------------------|----------|
| BUG-LOAN-001 | P0 | **CLOSED** | `statement.js` sums signed portions with `.plus()` only; `as-of-close.test.js` paidPrincipal=0 after reverse |
| BUG-INV-001 | P1 | **CLOSED** | scalar `purityBasis: null` + metals require explicit basis; test rejects scalar metal |
| INT-001 | P0 integration | **CLOSED on main** | Linear main history supersedes diverged phase branches; integration branch work is optional PR hygiene |
| CI-001 | P0 release gate | **OPEN (release)** | Local acceptance green; dedicated GH Actions proof for every HEAD still a release process gap, not a missing feature |
| DOC-001 | P1 | **CLOSED** | `status.registry.json` updated 2026-09-19 + `phase_progress` |
| PH6-001.. | P0 product | **CLOSED (local)** | Accounts/Income/Expense/Cheque/Tax/Assets/Planning on main; catalog IMPLEMENTED; 10 acceptance tests |
| OFF-001 / R-M24 | P0 release | **OPEN** | SPEC_LOCKED — real browser sql.js+IndexedDB E2E unproven |
| R-M07 | P1 freeze | **PARTIAL** | multi-hop/asOf/stale present; full historical golden family for FREEZE still open |
| R-M09 | P1 | **OPEN / SPEC_LOCKED** | Crypto network fee productization |
| R-M11 | P1 | **OPEN / SPEC_LOCKED** | Iran commission/tax/fee runtime policy |
| R-M16 | P1 | **OPEN / SPEC_LOCKED** | Full loan fee taxonomy runtime |
| R-M17 | P1 | **OPEN / SPEC_LOCKED** | Loan schedule policy versioning |
| R-M20 | Deferred | **DEFERRED** | TWR/MWR |
| R-M25 | P1 release | **OPEN / SPEC_LOCKED** | License entitlement proof |
| R-M26 | P1 product | **OPEN / SPEC_LOCKED** | Minimal navigation IA implementation |

## Summary counts

```
CLOSED on main (audit was stale):  BUG-LOAN-001, BUG-INV-001, INT-001, DOC-001, PH6-*
OPEN release/freeze:               CI-001 (process), OFF-001/R-M24, R-M07 PARTIAL
OPEN product/spec locked:          R-M09, R-M11, R-M16, R-M17, R-M25, R-M26
DEFERRED:                          R-M20
```

## Global flags (unchanged, correct)

```
FREEZE_PROVEN  = false
RELEASE_PROVEN = false
PRODUCTION     = NO-GO
```

## Safe next work order (only real OPEN items)

1. Optional: ensure GH Actions green on current `main` HEAD (CI-001 process).
2. Freeze-quality: expand R-M07 historical multi-hop golden family.
3. Release: OFF-001 browser sql.js + IndexedDB E2E.
4. Product/spec: R-M09 / R-M11 / R-M16 / R-M17 as scoped runtime work.
5. Product shell: R-M26 navigation IA; R-M25 license proof.
6. Do **not** re-open closed Loan sign or Phase 6 blueprint work unless a new regression appears.
