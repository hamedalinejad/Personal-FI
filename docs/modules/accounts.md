# Accounts

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Operational cash/bank/card accounts as projections over Core journal — not a second cash truth.

## Shared contracts
Money / FX / journal / fee / reversal / rebuild → [FINANCIAL-CORE.md](../FINANCIAL-CORE.md)  
API envelope / idempotency shape → [API.md](../API.md)  
Layers / public-api → [ARCHITECTURE.md](../ARCHITECTURE.md)  
Offline / backup / recovery → [OFFLINE-RELEASE.md](../OFFLINE-RELEASE.md)  
Process / freeze → [DEVELOPMENT.md](../DEVELOPMENT.md)  
Command cards → `docs/core/registry/command-catalog.json`

## 2. Scope
Personal offline edition; Core journal is cash/accounting truth.

## 3. Supported v1 behavior
| Item | Rule |
|------|------|
| accountClass (fin) | asset/liability/equity/income/expense |
| cashAccountKind (acc) | cash/bank/card/... operational kinds |
| balance | **DERIVED from journal** |
| transfer/deposit/withdraw | Core operations |

## 4. Unsupported / Deferred behavior
Parallel cash ledgers · treating acc balance as SoT · silent currency default

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Accounts list · account detail · transfer

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
`acc_accounts` · related links · Core `fin_accounts` / journal

## 9. Field ownership
| Field | Kind |
|-------|------|
| name, kind, currency | RAW |
| balance | DERIVED |
| fin_account mapping | REFERENCE |

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
account.create · update · archive · transfer · deposit · withdraw

## 12. Queries
Queries: module-local reads where listed below; otherwise Core/Reporting readers only.

## 14. State machine
active → archived (archive only if journal balance zero)

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
Transfers: balanced journal legs in settlement accounts; no domain cash table as truth

## 21. Cost basis / valuation
Per feature cost/valuation rules; snapshots not SoT.

## 27. Reports
Module statements + REPORTING from journal.

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
Feature tests under accounts when present; Core journal fixtures

## 33. Tests / proof
Accounting/chart tests in src/core/accounting

## Operational account kinds → fin_accounts
cash · bank_account · card · wallet · broker_cash · crypto_exchange_cash · cash_equivalent · credit_account  
Balances derived from journal. **No parallel cash ledger.**
## 28. Standalone edition behavior
Accounts UI is part of **Full** edition (and `/money` route).  
Standalone investment/loan editions **do not** require Accounts screens; they use local settlement accounts created by Core helpers.

## Account kind distinction (LOCKED)
| Field | Meaning | Values |
|-------|---------|--------|
| `fin_accounts.account_kind` | **Accounting class** | asset · liability · equity · income · expense |
| `acc_accounts.account_kind` | **Operational cash kind** | cash · bank_account · card · wallet · brokerage_cash · crypto_exchange_cash · cash_equivalent · credit_account |

Never collapse these into one semantic field.

## Archive (LOCKED)
Archive/close marks operational inactivity. **Posted journal history is immutable** and is never deleted because an account is archived. Reject archive when journal balance ≠ 0 (Decimal).

## Accounts ↔ ledger mapping (LOCKED)
| Layer | Table | Role |
|-------|-------|------|
| Operational | acc_accounts | user bank/card/wallet kinds |
| Ledger | fin_accounts | accounting class asset/liability/… |
| Link | acc_accounts.fin_account_id (when activated) | settlement posts through journal |

Every **activated** operational account used for settlement must resolve a fin_account_id. Cash balance on acc_* is SNAPSHOT only.
