---
id: DOC-AUTH-OP-JRNL-CARD
title: Operation → Journal Cardinality
status: approved
version: 1.0
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


One `fin_operations` row may create **1..N** `fin_journal_entries` (and many lines).

There is **no** invariant “one operation = one journal entry”.
Settlement, fees, and multi-leg trades commonly post multiple lines under one operationId.
