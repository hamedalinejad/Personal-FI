---
id: DOC-REL-MATRIX
title: Release Matrix (Command × Evidence)
status: approved
version: 0.1
---

Source commands: `status.registry.json`

For each command, RELEASE-PROVEN requires:

| Evidence | Meaning |
|----------|---------|
| success path | golden |
| invalid input | rejects |
| duplicate operationId | idempotent or conflict |
| field preservation | Gate H |
| recovery | crash/restore |
| standalone | edition boot |
| rebuild | deterministic |

Current package: **PARTIAL** — not all cells green. Production **NO-GO**.
