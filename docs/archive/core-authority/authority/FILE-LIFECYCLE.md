---
id: DOC-AUTH-FILE-LIFE
title: Documentation File Lifecycle
status: approved
version: 1.0
updated: 2026-09-10
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# Documentation cleanup and file lifecycle

## Rule

`P0` in a filename is **not** a reason to delete.

Delete only if:

```text
unique rule = 0
AND inbound refs = 0
```

Protect canonical contracts, schema, inventory, golden fixtures, and core feature docs.

## Mandatory keep — governance

- DOC-AUTHORITY-CHAIN.md  
- DOC-CONSOLIDATION-POLICY.md  
- GO-NO-GO.md  
- OPEN-ISSUES-REGISTER.md  
- CODING-GATE.md  
- EXECUTION-HANDOFF.md  
- ARCHITECTURE-LOCKED.md  
- P0-DOC-CLOSED-PREVENTION.md  

## Mandatory keep — financial canonical homes

Accounting-Core, Accounting-Calculation-Invariants, Financial-Invariants, Canonical-Financial-Operation, Canonical-Cash-Model, Cash-Settlement-Adapter, Cost-Basis-Engine, Fee-Treatment-Matrix, Instrument-Identity, Essential-Reports, Data-Preservation-Contract, Field-Level-SoT, Field-Level-Data-Ownership-Matrix, Source-of-Truth-Matrix, Domain-Dependency-Matrix, Data-Dictionary

## Mandatory keep — schema / fixtures

`docs/core/db/**` protected artifacts, `field-inventory.checklist.tsv`, `docs/core/fixtures/**`

## Optional cleanup candidates (after inbound-ref scan)

| ID | File | Recommendation |
|----|------|----------------|
| C-001 | FINAL-THINK-TANK-AUDIT-2026-09-03.md | Delete only if refs=0 |
| C-002 | THINK-TANK-R021-060-AND-FILE-LIFECYCLE.md | Candidate after ref check |
| C-003 | THINK-TANK-STANDALONE-CASH-IRAN.md | Candidate after ref check |
| C-004 | AUDIT-HISTORY-NOTE.md | Keep for trail or one-line merge into consolidation policy |

## Never delete solely for “P0” in name

`P0-DOC-CLOSED-PREVENTION.md` is the anti-regression contract for closed defects.


## 2026-09-10 reference scan

Optional cleanup candidates C-001…C-004 **kept** — inbound refs found. Do not mass-delete.
