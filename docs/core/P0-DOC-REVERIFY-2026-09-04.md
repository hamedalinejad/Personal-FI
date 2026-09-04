# P0-DOC Re-verify — 2026-09-04

| ID | Location | Rule locked | Evidence | Status |
|----|----------|-------------|----------|--------|
| **P0-DOC-001** | Cash-Settlement-Adapter.md | Cash SoT = `fin_accounts` + `fin_journal_lines` only; adapters pick which account row | Invariant + forbidden wording at top of file | **CLOSED** |
| **P0-DOC-002** | db/01-schema-tables.md | `acc_transactions` = bank event log / projection; not balance SoT | Table list + P0-FIX-002 section; dual SUM forbidden | **CLOSED** |
| **P0-DOC-003** | Investment-Crypto.md | `instrumentId` = `ref_instruments.id`; symbol=label; assetKey=SYSTEM_INDEX | Identity locks + OPEN-012 uniqueness | **CLOSED** |
| **P0-DOC-004** | Investment-Crypto.md | Single `feePresence` matrix → gross/net/fee | Sole truth table section | **CLOSED** |
| **P0-DOC-005** | P0-COST-BASIS-PNL lock | `economicFeeRole` before cost mutation; acquisition vs post-acquisition burn | P0-FINAL-003 + P0-FIX-005 | **CLOSED** |
| **P0-DOC-008** | P0-FINAL-021-026-LOCKS.md | Wealth + Investment Return bridges; mixed formula LEGACY/SUPERSEDED | Explicit SUPERSEDED block | **CLOSED** |
| **P0-DOC-009** | Fixed-Income-Funds.md | `accountId` nullable standalone; required only integrated command | P0-FIX-009 sections | **CLOSED** |
| **P0-DOC-011** | Investment-Stocks-Iran.md | IRR + `exchangeRateToBase` to user base; Tether not mandatory | Opening rules + P0-FIX-011 | **CLOSED** |
| **P0-DOC-013** | Investment-Stocks-Iran.md | `accountId` nullable at schema; command-level require when integrated | P0-FIX-013 + entity field note | **CLOSED** |
| **P1-CODE-006** | harness.ts | Exact structural string compare; `001` ≠ `1` | assertExpected + harness.test.ts | **CLOSED** |

No new P0 files created. Concept homes remain authority.
