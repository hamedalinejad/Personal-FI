---
id: DOC-AUTH-SECTION-STATUS
title: Section Status Snapshot
status: approved
version: 1.0
updated: 2026-09-12
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


| بخش | وضعیت |
|-----|--------|
| Accounting Core | GREEN |
| SoT / Data Ownership | GREEN |
| Decimal / Money | GREEN locked |
| FX Model | GREEN design; implementation must stay aligned |
| Cost Basis | GREEN + Model A unit lock |
| Date Semantics | GREEN |
| Cash Model | GREEN design; Port adoption PARTIAL |
| Fee Model | GREEN core; feature adoption PARTIAL |
| Operation Model | GREEN |
| Reversal | GREEN design |
| Instrument Identity | GREEN |
| Schema documentation | GREEN baseline; sample generic `date` cleaned where found |
| Relationship Matrix | GREEN design; proof NOT closed |
| Crypto | PARTIAL — inventory account now = costCurrency |
| Stocks | PARTIAL — T+n trade leg; settle command SPEC_LOCKED |
| Funds | PARTIAL |
| Metals | PARTIAL — foreign fee not summed into tx cash |
| Production | NO-GO |

Primary next work: **cross-document consistency pass** per operation (not a new architecture rewrite).
