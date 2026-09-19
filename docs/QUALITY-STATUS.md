# Quality Status

**Live status only — not a dashboard cache of matrix counts.**

- Production: **NO-GO**
- SEMANTIC_CODING_READY: see `docs/core/registry/status.registry.json`
- FREEZE_PROVEN: false
- RELEASE_PROVEN: false

Machine authorities: command-catalog · field-preservation-matrix · schema.sql · status.registry

## Closure 2026-09-18 (final audit bugs)

- BUG-001 funds.redeem AMOUNT_PRICE_MISMATCH when price and proceeds disagree
- BUG-002 crypto reduce_received_quantity quantity conservation
- BUG-003 v1 feeCurrency must equal transaction/cost currency (crypto/metals)
- BUG-004 funds.subscribe amount_based does not silently override conflicting price
- BUG-007 field-preservation consumes object-shaped schema.manifest.tables
- BUG-008/009 DEFERRED reason+owner; stored == persistence.table.column
- BUG-011 funds.distribution.reinvest REJECTED in catalog
- BUG-012 file-inventory updated for new tests/scripts
- BUG-013 release-evidence requirements count uses Object.keys
- BUG-014 requireFxIfCrossCurrency rejects non-positive FX
- BUG-015 removed dead ILLEGAL regex
- BUG-016 dividend withholdingTax → fee_tax column

Iran fee policy data, browser sql.js E2E, TWR/MWR remain deferred (not v1 blockers for coding start).

## Matrix canonicalization (2026-09-18)

- Aligned 47 stale `stored` vs `persistence.table.column` registry rows to real schema.
- Promoted incorrectly DEFERRED fields that are accepted/implemented to PERSISTED (or DERIVED for pure schedule calc).
- `funds.distribution.reinvest` remains REJECTED with reason.
- Gate: field-preservation-check OK (492 rows, 882 schema cols).

## Phase 0 — Conditional constraints (2026-09-18)

- Machine `constraints[]` on funds.redeem, funds.subscribe, metals.buy, loan.create, crypto.buy
- `scripts/command-constraints-check.js` + `npm run command:constraints` in gates
- File inventory includes acceptance test previously missing
- field-preservation gate remains GREEN

## Phase 1 — Money + Accounting Core hardening (2026-09-18)

Executable vectors in `src/core/money/phase1-money-hardening.test.js`:
- Decimal add/sub/mul/div, zero, large, high-precision quantity
- Reject JS Number at money boundary
- FX: identity, direct, two-hop, missing/zero/negative/stale/historical asOf
- Journal: ≥2 lines when posted, base balance, finite money, rate helpers
- Immutable posted, fee/qty conservation, invariant gate
- Idempotency covered by existing `idempotencyConflict.test.js`

## Phase 1 defect closure (2026-09-18)

- P0-07: `scripts/field-preservation-check.test.js` — fail on stored mismatch, missing reason, missing schema column
- P1-01: `exchangeRateToBase` + amounts canonicalized before economic hash
- P1-02/03: removed always-true `|| true` and Number `times(3)` from phase1 tests
- P1-04: `sumDecimalStringsStrict` (missing ≠ zero)
- P1-05/06: fee conservation requires direction; qty conservation requires canonical treatment
- P1-07: `runInvariantGate` receives `baseCurrency`
- P1-08: journal currency+side required on every line
- P1-09: FX rates strictly positive in gate; interest may be non-negative
- P1-10/11: `FX_PAIR_INVALID` + `FX_INVERSE_CONFLICT`
