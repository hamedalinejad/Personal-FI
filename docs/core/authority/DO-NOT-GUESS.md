---
id: DOC-AUTH-NO-GUESS
title: Do-not-guess rules for implementers
status: approved
version: 1.0
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


Until the relevant contract is locked, **do not guess** missing SQL columns, currency, identity, fee/tax treatment, T+n calendar, coin valuation, NAV vs transaction price, standalone cash, as-of reconstruction, reversal scope, or report snapshot authority.

```text
reject assumption → mark requirement OPEN → implement after contract locked
```
