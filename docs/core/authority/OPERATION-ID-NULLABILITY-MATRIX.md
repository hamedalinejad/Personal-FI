---
id: DOC-AUTH-OPID-NULL
title: operation_id nullability matrix
status: approved
version: 1.0
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# P0-OP-012

| Table | operation_id | Rule |
|-------|--------------|------|
| fin_journal_entries | NOT NULL | Posted-only path |
| inv_*_transactions (crypto/stocks/funds/metals) | NOT NULL | Posted-only |
| ln_transactions | NOT NULL (posted) | Draft loan header may omit until post |
| acc_transactions | NULL allowed | Draft cash event only; posted requires non-null |
| cheques | NULL until issued | Issued/paid require non-null |
| tax_events | NULL only if manual adjustment | Otherwise require |

**Runtime:** financial writes that post journals use `status: posted` and always allocate `operationId` first.
