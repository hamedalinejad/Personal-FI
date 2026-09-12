---
id: DOC-AUTH-RESULT-SOT
title: result_json vs relational SoT
status: approved
version: 1.0
---

# P0-OP-007

| Fact | SoT |
|------|-----|
| status, business_date, base_currency, settlement_date, event_at, command_hash | `fin_operations` columns |
| journal lines | `fin_journal_lines` |
| result_json | Replay/cache only — rebuildable from columns + domain tables |

Load path must prefer typed columns over snapshot for canonical fields.
