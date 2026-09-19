# Response to external executive audit (2026-09-19)

**Subject audit claim:** “all items are completed” is not supported; Phase 4/5/6 incomplete.  
**Repository authority at response time:** `main` @ `5eec95d`  
**This document:** corrects **stale snapshot claims** against live main. It does **not** claim FREEZE or RELEASE proof.

## 1. Corrected phase table

| Phase | External audit claim | Verified main state | Evidence |
|-------|----------------------|---------------------|----------|
| 0 | Implemented; freeze not proven | **Confirmed** — implemented; freeze not proven | field-preservation 492 rows OK; `FREEZE_PROVEN=false` |
| 1 | Implemented / inherited proof | **Confirmed** | money/FX/journal paths; carry-over closed into P2 |
| 2 | VERIFIED | **Confirmed** | Accounting Kernel on main; historical CI Run 390 noted in pack |
| 3 | VERIFIED | **Confirmed** | Persistence/recovery on main; historical CI Run 396 noted |
| 4 | NOT COMPLETE (Run 400, 444/445) | **Superseded** — regression fixed | commit `8aa1ae4`; `as-of-close.test.js` **2/2 pass** |
| 5 | NOT PROVEN (branch HEAD 518537…) | **Superseded** — on main | commit `12fb3b6`; `investment.test.js` **5/5 pass** |
| 6 | NOT IMPLEMENTED (blueprint only) | **Superseded** — on main | commit `27b465c`; `phase6-core-finance.test.js` **10/10 pass** |

Combined local acceptance (P4+P5+P6): **17/17 pass** on `5eec95d`.

## 2. What remains correctly NOT complete

These statements from the external audit remain **true** and must not be flipped:

```text
FREEZE_PROVEN   = false
RELEASE_PROVEN  = false
PRODUCTION      = NO-GO
```

Intentionally open / later-scope examples (not Phase 0–6 local-acceptance blockers):

- R-M05 identifier policy runtime
- R-M12 corporate actions
- R-M20 investment performance (TWR/MWR)
- R-M24 browser offline persistence RELEASE E2E
- Advanced loan day-count / borrower role
- Deferred crypto commands

## 3. Documentation-quality notes (D-01 / D-02)

| ID | Issue | Disposition |
|----|-------|-------------|
| D-01 | Historical audit text inside phase narrative can confuse coders | Phase pack `INDEX.md` + this response are authoritative for **current** status; historical CI run numbers stay labeled historical |
| D-02 | Unchecked DoD boxes in older phase prose | Treat unchecked boxes as **stale checklist formatting**; live proof is QUALITY-STATUS + tests + registry, not attachment prose |

Rule: **current phase-pack header + registry + code + tests win** over any embedded historical paragraph.

## 4. Machine checks re-run for this response

```text
npm run field:preservation  → OK (42 commands, 492 rows, 882 cols)
npm run freeze:check        → structure OK; explicitly not freeze-proof
npm run status:check        → OK
P4+P5+P6 node --test        → 17/17 pass
```

## 5. Forbidden conclusions

Do **not** conclude from this response:

- that the product is RELEASE-PROVEN
- that FREEZE_PROVEN is true
- that Production is GO
- that every R-M* requirement is implemented

Do conclude:

- Phase 4 regression cited as Run 400 is **fixed on main**
- Phase 5 and Phase 6 are **implemented on main** with local acceptance green
- Production remains **NO-GO** until freeze/release evidence exists

## 6. Phase 1–3 external audit alignment (same session)

Verified against `main` @ response HEAD.

### Phase 1
- Material implementation **confirmed**: Decimal boundary, Number rejection, FX, journal invariants, fee/qty conservation, posted immutability, idempotency, economic hash.
- Registry: **R-M06 = IMPLEMENTED**.
- Registry: **R-M07 = PARTIAL** (multi-hop + asOf/stale/pair/inverse present; full multi-hop historical golden family still open for FREEZE).
- Local: `phase1-money-hardening.test.js` **36/36 pass**.

**Result:** implementation substantially complete for claimed foundation; independent freeze-level historical FX proof remains partial — matches external audit.

### Phase 2
- Kernel areas present on main (journal base path, line_number uniqueness, fee safety, account kinds/roles, reversal helper, result_json non-SoT, constraints, gates).
- Historical CI Run 390 SUCCESS remains pack evidence; current main supersedes branch-only HEAD `e39adc0…`.
- PR mergeable state is integration hygiene, not a test failure.

**Result:** VERIFIED for claimed kernel scope — matches external audit.

### Phase 3
- Integrity firewall, durability ack/reconcile, backup/restore validation, corrupt reject, result_json non-SoT — present on main (`integrity.js`, `worker.js`).
- Historical CI Run 396 SUCCESS remains pack evidence.
- **R-M24** still **SPEC_LOCKED** — real browser sql.js + IndexedDB RELEASE E2E open.

**Result:** VERIFIED for claimed scope; browser release proof open — matches external audit.


## 7. Closure of residual audit blockers (same HEAD lineage)

| Prior audit blocker | Disposition on main |
|---------------------|---------------------|
| Phase 4 sign-model failure (paidPrincipal 400) | Fixed in `8aa1ae4`; acceptance green |
| Phase 5 CI-unproven branch HEAD | Code on main `12fb3b6`+; local acceptance green |
| P5-STATIC-01 zero → null | Fixed: `market != null` / `unrealized != null`; test asserts `"0"` |
| P5-STATIC-02 scalar metal purity default | Already contract-safe: scalar purityBasis null + metals path requires explicit basis; test rejects scalar metal |
| Phase 6 blueprint only | Implemented `27b465c`; catalog status → IMPLEMENTED for those commands |
| Catalog PARTIAL for P6 commands | Updated to IMPLEMENTED (maturity=local_acceptance; not RELEASE-PROVEN) |

Still true:

```
FREEZE_PROVEN = false
RELEASE_PROVEN = false
PRODUCTION = NO-GO
```
