---
id: DOC-AUTH-REVERSAL
title: Reversal identity contract
status: approved
version: 1.0
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# ACCOUNTING-004

**Core reversal identity (SoT):**

```text
originalOperationId  →  reversalOperationId
```

Stored as:

```text
fin_operations.reverses_operation_id
fin_operations.corrects_operation_id  (correction, not reverse)
```

Feature-level links (`ln_transactions.reverses_transaction_id`, `reversed_income_id`, …) are **derived convenience** only.  
They must never define reversal truth independently of `fin_operations`.
