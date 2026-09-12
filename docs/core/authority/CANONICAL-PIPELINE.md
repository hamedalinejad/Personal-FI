---
id: DOC-AUTH-PIPELINE
title: Canonical financial pipeline (must not bypass)
status: approved
version: 1.0
---

```text
UI
  → Feature Public API
  → validation
  → normalize decimal/date/identity
  → resolve instrument/account/party
  → build Financial Operation
  → attach calculation context
  → Fee Engine
  → domain policy mapper
  → CostBasis / Schedule / CA engine as applicable
  → build balanced journal
  → validate accounting invariants
  → single SQLite transaction
  → SQL commit
  → durable persist ACK
  → return canonical API envelope
  → rebuild/cache projection
```

No feature may bypass this pipeline.
