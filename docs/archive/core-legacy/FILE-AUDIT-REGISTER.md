# File-by-file Audit Register (§19)

| Area | Primary paths | Status | Key action |
|------|---------------|--------|------------|
| Product/IA | docs/00-Product/** | REVIEWED | ≤6 destinations |
| Core authority | docs/core/authority/**, GO-NO-GO | REVIEWED | one status authority |
| Accounting | Canonical-*, journal contracts | DEEP | vocabulary/schema |
| Data ownership | Field-Level-*, inventory | DEEP | Kind vocabulary |
| Schema | docs/core/db/** | DEEP | sync pipeline green |
| Fixtures | docs/core/fixtures/** | REVIEWED | no empty golden |
| Accounts | features/00-* | DEEP | enum + direction |
| Income/Expense | 01-*, 02-* | REVIEWED | operation/cash SoT |
| Cheques | 03-* | REVIEWED | journal lifecycle |
| Loans | 04-*, Loan-*, src/**/loan | DEEP | equal-principal v1 |
| Crypto | 05-01-*, src/features/crypto | DEEP | fee + recovery |
| Stocks | 05-02-*, src/features/stocks | DEEP | T+n + CA |
| Funds | 05-03-*, src/features/funds | DEEP | NAV≠tx price |
| Metals | 05-04-*, src/features/metals | DEEP | purity/premium |
| Physical | 06-Physical-* | REVIEWED | Core cash link |
| Budget/Goals/Bills | 07–09 | REVIEWED | not cash SoT |
| Notifications | 10-* | REVIEWED | no finance mutation |
| Reports | 11–13 | DEEP | journal + as-of |
| Tax | 14-*, src/core/tax | DEEP | payTax paid-only |
| Docs/Settings/Sec | 15,16,18 | REVIEWED | offline |
| FX | 17-*, domain/fx | REVIEWED | path + strings |
| Price | 19-*, domain/price | DEEP | uniqueness |
| Scripts/CI | scripts/**, workflows | REVIEWED | blocking gates |
| Runtime core | src/core/** | DEEP | op/persistence first |
| Runtime features | src/features/** | DEEP | match registry |
