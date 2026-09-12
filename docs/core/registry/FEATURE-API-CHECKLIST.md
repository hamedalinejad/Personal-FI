---
id: DOC-API-FEATURE-CHECKLIST
title: Feature API minimum surface checklist
status: approved
version: 1.0
---

Required when applicable:

| Feature | capabilities() | getById | list | reconcile | rebuild | Notes |
|---------|----------------|---------|------|-----------|---------|-------|
| Loan | yes | getLoan | listLoans | n/a | schedule rebuild partial | reference |
| Crypto | yes | PARTIAL | PARTIAL | n/a | PARTIAL | buy/sell/transfer |
| Stocks | yes | PARTIAL | PARTIAL | settle | PARTIAL | |
| Funds | yes | PARTIAL | PARTIAL | n/a | PARTIAL | |
| Metals | yes | PARTIAL | PARTIAL | n/a | PARTIAL | |
| Accounts | SPEC | SPEC | SPEC | SPEC | SPEC | |
| Tax | PARTIAL | listTaxEvents | listTaxEvents | n/a | n/a | events runtime |
| Physical Assets | SPEC | SPEC | SPEC | n/a | SPEC | |
| Budget | SPEC | SPEC | SPEC | n/a | n/a | |
| Goals | SPEC | SPEC | SPEC | n/a | n/a | |
| Bills | SPEC | SPEC | SPEC | n/a | n/a | |

SoT lifecycle: `status.registry.json` + this checklist. Do not invent second status vocabularies.
