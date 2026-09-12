---
id: DOC-AUTH-STOCKS-CA
title: Corporate action single event path
status: locked
version: 1.0
---

# P0-INV-003

One versioned CA event identity:

```text
ca_event_id
instrument_id
effective_date
event_type
ratio / quantity effect
cost_basis_policy_version
journal_effect
reversal_policy
operation_id (when posted)
```

No parallel undocumented CA mutation paths.
