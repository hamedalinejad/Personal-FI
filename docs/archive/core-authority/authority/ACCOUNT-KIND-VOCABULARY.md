---
id: DOC-AUTH-ACCOUNT-KIND
title: Accounting class vs operational cashAccountKind
status: locked
version: 1.0
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# P0-CASH-001 / 002

| Concept | SQL location | Values |
|---------|--------------|--------|
| **Accounting Account Class** | `fin_accounts.account_kind` | `asset\|liability\|equity\|income\|expense` |
| **Operational cashAccountKind** | `acc_accounts.account_kind` | `cash\|bank_account\|card\|wallet\|brokerage_cash\|crypto_exchange_cash\|cash_equivalent\|credit_account` (+ legacy `bank\|investment\|loan\|credit\|other` for migration) |

Never call both “canonical accountKind”. Mapping operational → class is Core policy (e.g. bank_account → asset).
