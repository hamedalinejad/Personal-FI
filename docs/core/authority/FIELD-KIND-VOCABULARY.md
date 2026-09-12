---
id: DOC-AUTH-FIELD-KIND
title: Single field Kind vocabulary
status: locked
version: 1.0
---

# P0-FIELD-001 / 002

Authoritative Kind set (Field-Level-SoT, Ownership-Matrix, inventory TSV):

```text
RAW
DERIVED
SNAPSHOT
EXTERNAL_REPORTED
LABEL
SYSTEM_INDEX
REFERENCE
STATUS
```

| Kind | Meaning |
|------|---------|
| **SYSTEM_INDEX** | System-derived identity/index; non-user-editable; **never financial SoT** |
| **RAW** | Observed/user/input fact |
| **DERIVED** | Rebuildable from RAW + engine version |
| **SNAPSHOT** | Cached projection |
| **EXTERNAL_REPORTED** | Provider-reported, provenance required |
| **LABEL** | Display-only |
| **REFERENCE** | FK / id pointer |
| **STATUS** | Lifecycle enum |

# P0-FIELD-003 — deletedAt

**Prohibited** on posted financial ledger rows (`fin_journal_*`, posted `fin_operations`, inv_*_transactions when posted).  
Allowed only on non-financial/metadata entities where soft-delete policy is explicit.
