---
id: DOC-AUTH-DOCS-READY
title: Documentation Ready Checklist
status: approved
version: 1.0
updated: 2026-09-12
---

# Documentation package — ready for implementation scaffold

## Binding authority (must read first)

1. `DOC-AUTHORITY-CHAIN.md`
2. `GO-NO-GO.md` — production **NO-GO**
3. `CODING-GATE.md`
4. `authority/IMMUTABLE-ACCOUNTING-RULES.md`
5. `authority/DATA-OWNERSHIP-AND-MODELS.md`
6. `authority/API-CONTRACT.md`
7. `authority/FINAL-VERDICT-AND-GATES.md`
8. `authority/IMPLEMENTATION-ORDER.md`
9. `authority/STATUS-TAXONOMY.md`
10. `authority/FILE-LIFECYCLE.md`

## Closed defects / open gaps

- `authority/FIXED-REGISTER.md` — do not reopen FIXED-001…017
- `authority/OPEN-REQUIREMENTS-RELEASE.md` — R-001…R-012 not RELEASE-PROVEN
- `command-coverage/COMMAND-FIELD-MATRIX.md`
- `command-coverage/FEATURE-COMMAND-STATUS.md`
- `requirements/REVERSAL-SPECS.md`
- `relationships/TABLE-RELATIONSHIPS.md`

## Schema & invariants

- `docs/core/db/schema.sql` + migration docs
- `Financial-Invariants.md`, `Canonical-Financial-Operation.md`, `Canonical-Cash-Model.md`
- `Fee-Treatment-Matrix.md`, `Instrument-Identity.md`

## Project state (mandatory wording)

```text
Documentation-first
+ implementation scaffold / reference runtime
+ pre-production
```

Production remains **NO-GO** until RELEASE-PROVEN evidence (golden + recovery + CI + no-field-loss + standalone) is green per feature.

- `authority/THINK-TANK-FINAL-ANSWER.md` — final Q&A / coding vs production
