---
id: DOC-AUTH-STOCKS-DATES
title: tradeDate ≠ settlementDate
status: locked
version: 1.0
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# P1-INV-006

Position quantity uses **tradeDate**.  
Cash/payable uses **settlementDate** / effectiveCashDate.

No reconciliation may overwrite settlementDate with tradeDate.
