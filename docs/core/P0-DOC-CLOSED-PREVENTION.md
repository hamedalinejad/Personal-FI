# P0-DOC-001…014 — CLOSED + reintroduction prevention

All items below are **CLOSED / LOCKED**. CI/docs review must reject regressions.

| ID | Final rule | Forbidden reintroduction |
|----|------------|---------------------------|
| **P0-DOC-001** | CashSettlementPort routes to Core `fin_accounts` + journal only | Feature-owned cash balance SoT / “local ledger truth” |
| **P0-DOC-002** | `acc_transactions` = event/projection | `SUM(journal)+SUM(acc_transactions)` same event |
| **P0-DOC-003** | Identity = `ref_instruments.id` | rebuild/history keyed only by symbol/assetKey |
| **P0-DOC-004** | Keep gross/fee/net + feePresence | holding qty = gross when fee_from_received |
| **P0-DOC-005** | One fee → one economic role | capitalize **and** expense same fee |
| **P0-DOC-006** | C2C dest cost = economic consideration | dest cost from spot market mark alone |
| **P0-DOC-007** | `totalFeesPaidBase` DERIVED/rebuildable | mutable independent fee SoT |
| **P0-DOC-008** | Period return = Essential-Reports model | legacy (end−start)/start without flows as canonical |
| **P0-DOC-009** | accountId nullable in standalone | unconditional NOT NULL accountId for all editions |
| **P0-DOC-010** | Fund → instrumentId | parallel fund identity graph |
| **P0-DOC-011** | Generic FX/currency for stocks | hard-coded USDT as stock accounting currency |
| **P0-DOC-012** | Broker cash via port + journal | feature `cashBalance` as SoT |
| **P0-DOC-013** | accountId required by mode | one global required rule |
| **P0-DOC-014** | market obs ≠ CA ≠ feature tx ownership | single module owns all three |

## Prevention checklist (PR review)

- [ ] No new prose “feature cash ledger is balance truth”
- [ ] No rebuild by symbol/assetKey without resolve→instrumentId
- [ ] Fee examples use single treatment
- [ ] C2C examples use consideration
- [ ] totalFeesPaidBase not `+=` persisted as authority
- [ ] Report formulas point to Essential-Reports / attribution v1

Regression code helpers related to fees/C2C/identity: see `BUG-CODE-REGRESSION-INVARIANTS.md`.
