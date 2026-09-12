---
id: DOC-AUTH-DOC-STATUS
title: Documentation status taxonomy
status: approved
version: 1.0
---

# DOC-001 — Schema freeze vocabulary

| Token | Meaning |
|-------|---------|
| **SPEC_LOCKED** | Semantic/schema **contract** is frozen for coding |
| **FREEZE_PROVEN** | Manifest/checksum/inventory evidence proves freeze for **release** |
| **RELEASE-PROVEN** | Full golden/recovery/standalone evidence |

Current: SPEC_LOCKED=yes, FREEZE_PROVEN=no (`status.registry.json`).

`schema.sql` “freeze: not proven” means **FREEZE_PROVEN**, not absence of SPEC_LOCKED.

# DOC-002 — Parallel work

```text
Scaffold / domain contract work may proceed in parallel.
Production integration / release proof remains gated by IMPLEMENTATION-ORDER.
```

# DOC-003 — Coverage vs reconciliation

| Status | Meaning |
|--------|---------|
| **DOCUMENTATION-COVERAGE-COMPLETE** | Topics exist across the product |
| **CANONICAL-RECONCILIATION-PENDING** | Field/model contradictions not all closed |

Coverage ≠ contradiction-free.
