---
id: DOC-AUTH-LOAN-SCHEMA-DISP
title: Loan v1 schema disposition (single table)
status: approved
version: 1.0
---

# P0-LOAN-011

| Table / column | Disposition | Note |
|----------------|-------------|------|
| ln_loans | KEEP | Core loan header |
| ln_loans.day_count_convention | KEEP narrowed | v1: `period_based`\|`monthly` only |
| ln_loans.day_count | DEPRECATED | alias → day_count_convention |
| ln_schedule_snapshots | KEEP | versioned JSON + schemaVersion |
| ln_transactions | KEEP | posted only with operation_id |
| rate history table | DEFERRED | P0-LOAN-007 until DayCount/variable engine |
| actual_365 / 30_360 in CHECK | REMOVED from v1 CHECK | Requires DayCountEngine |

Migration: existing rows with unsupported day_count_convention must be rewritten to `period_based` or blocked from schedule generation.
