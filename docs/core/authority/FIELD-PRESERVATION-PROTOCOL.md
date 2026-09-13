---
id: DOC-AUTH-FIELD-PRESERVE
title: Field-Preservation Protocol
status: approved
version: 1.0
updated: 2026-09-12
authority: binding
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# Field kinds

Every schema field has an **owner** and a **kind**:

| Kind | Meaning |
|------|---------|
| **raw** | Immutable evidence |
| **canonical** | Normalized operational truth |
| **derived** | Reproducible; never overwrites inputs |
| **reference** | FK / external pointer |
| **provenance** | Source, as-of, fetch time, rule version |
| **status** | Lifecycle / health |
| **presentation** | Display-only (e.g. Toman); not a second ledger currency |

# Rules

1. **Raw** fields are immutable evidence.
2. **Canonical** fields are normalized operational truth.
3. **Derived** fields are reproducible and **never overwrite** their inputs.
4. When a field is superseded, keep the old value in its original raw/provenance location or a versioned legacy structure until **migration proof** passes.
5. **Never** map an unknown input to `0`, `""`, `false`, current date, current price, or a guessed currency just to satisfy a schema.
6. Every import/export **roundtrip** must prove request data survives under the expected normalization rules.
7. **Column removal** requires all of:
   - replacement field
   - migration mapping
   - backward-reader plan
   - field inventory update
   - fixture update
   - checksum update
   - zero-field-loss proof

# Related

- `docs/core/Field-Level-SoT.md`
- `docs/core/field-inventory.checklist.tsv`
- Gate H no-field-loss tests
