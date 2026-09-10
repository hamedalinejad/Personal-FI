---
id: DOC-SCHEMA-FREEZE
title: Schema Freeze Gates
status: reviewed
version: 0.1
---

# Schema freeze is two gates

| Gate | Meaning |
|------|---------|
| **SPEC FREEZE** | Semantic decisions complete; coding against schema.sql allowed |
| **PROVEN FREEZE** | Machine evidence: migration checksum, inventory, CI green |

Header `freeze: not proven` means PROVEN FREEZE pending — not that SPEC is open.
