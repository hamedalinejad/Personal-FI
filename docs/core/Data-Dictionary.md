# Data Dictionary (شروع — گسترش تدریجی)

هر فیلد مهم مالی:

| field | type | nullable | unit | precision | currency? | SoT? | derived? | immutable? | FK | notes |
|-------|------|----------|------|-----------|-----------|------|----------|------------|-----|-------|
| amount | TEXT decimal | no | money | CurrencyRecord | tx currency | domain/journal | no | yes (after post) | | >0 معمولاً |
| quantity | TEXT decimal | no | asset qty | instrument | | domain | no | yes | | |
| exchangeRateToBase | TEXT decimal | when needed | rate | | | op | no | yes | | |
| averageBuyPrice | TEXT decimal | | price | | | **derived** | yes | no | | rebuild |
| currentBalance | TEXT decimal | | money | | | **derived** | yes | no | | never report SoT |
| accountId (journal line) | UUID | no | | | | journal | no | | fin_accounts | |
| instrumentId | UUID | no | | | | holding/tx | no | | ref_instruments | |
| operationId | UUID | no | | | | all legs | no | | fin_operations | |

توسعه‌دهندگان قبل از فیلد جدید: یک ردیف اینجا + schema.
