---
id: DOC-AUTH-OPEN-REQ
title: Requirements Still Not Release-Proven
status: reviewed
version: 0.1
updated: 2026-09-12
---

# Open requirements (scaffold ≠ RELEASE-PROVEN)

| ID | Topic | Notes |
|----|--------|-------|
| R-001 | Complete command coverage | Only buy/subscribe/loan payment paths integrated |
| R-002 | Complete reversal plan | Spec exists; reverse* not implemented for investments |
| R-003 | Gate H no-field-loss | PARTIAL: crypto.buy persist→load fixture; full matrix pending |
| R-004 | Golden family CI | Families listed; not all green in CI evidence |
| R-005 | Recovery CI | Matrix documented; fixtures incomplete |
| R-006 | Browser sql.js adapter | Port only |
| R-007 | Full accounting reports | PARTIAL: GL + Trial Balance + Account Activity |
| R-008 | Full investment reporting | Not implemented |
| R-009 | Iran policy engines | Settlement version field only partial |
| R-010 | Tax separation | SPEC_LOCKED |
| R-011 | Import provenance | Schema present; runtime gate incomplete |
| R-012 | Deterministic rebuild | Contract only |

Production remains **NO-GO** until RELEASE-PROVEN evidence exists.
