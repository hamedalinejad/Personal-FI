# QUALITY-STATUS

Live only. Not a requirements catalog.

| ID | Area | Status | Owner | Test | Commit |
|----|------|--------|-------|------|--------|
| DOC-STD | DOCUMENTATION-STANDARD | LOCKED | DOCUMENTATION-STANDARD | docs:validate | 78bb737+ |
| DOC-TREE | One owner / no dual human core | TRUE | DOCUMENTATION-STANDARD | inventory | 78bb737+ |
| FIX-LOAN | Duplicate LOAN-FLAT removed | TRUE | fixtures | loan-flat-fixture | 78bb737 |
| ACC-TAX | Acceptance capability names | TRUE | DEVELOPMENT | npm test | 78bb737 |
| MOD-11 | All 11 modules 34-section | TRUE | modules/* | — | this |
| LOAN-REF | modules/loan.md vertical template | TRUE | modules/loan | — | this |
| REL | Production release | **NO_GO** | OFFLINE-RELEASE | — | — |
| TST | Suite | GREEN | DEVELOPMENT | npm test | — |

### Documentation standardization DoD
```
[x] DOCUMENTATION-STANDARD.md exists
[x] One owner map (STANDARD + DEVELOPMENT)
[x] No competing human contracts under docs/core
[x] Bug/Audit micro-docs gone from active docs
[x] Module template shared (DEVELOPMENT §)
[x] All 11 modules exist
[x] Machine files remain
[x] Duplicate LOAN-FLAT removed
[x] Bug-named acceptance consolidated
[x] package test globs deduped
[x] docs validator passes
[x] Module docs complete (34-section)
[ ] Full gates (run on CI/dev machine: npm run gates)
[ ] RELEASE_PROVEN
```

**Cycle locked:** FEATURE → OWNER DOC → CODE → TEST → FIXTURE → QUALITY → COMMIT  
**Forbidden cycle:** AUDIT → BUG DOC → MATRIX → FINAL AUDIT loop


| ID | Area | Status | Owner | Test | Commit |
|----|------|--------|-------|------|--------|
| P0-04 | requirements live refs FAIL | FIXED | scripts | requirements-matrix-check.test | this |
| P0-05 | freeze flags single source | FIXED | status.registry | docs-validator | this |
| P0-06 | authority_owners current | FIXED | status.registry | docs-consistency | this |
| P0-07 | RELEASE-EVIDENCE live docs | FIXED | RELEASE-EVIDENCE | — | this |
| P0-08 | balance cache not SoT | FIXED | DATA-MODEL | — | this |
