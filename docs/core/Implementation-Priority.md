# Implementation Priority (قبل از Code)

## P0 — حتماً قبل از Code

| مورد | سند |
|------|-----|
| Canonical Instrument ID | `Instrument-Identity.md` |
| یک SoT برای Cash | `Canonical-Cash-Model.md` · `Cash-Settlement-Adapter.md` |
| Decimal String validation | `Precision-Policy.md` · `Rounding-Policy.md` |
| Field-Level SoT کامل | `Field-Level-SoT.md` · `Raw-vs-Derived-Data.md` |
| Financial Operation Matrix | `Financial-Operation-Matrix.md` |
| Operation / Idempotency | `Canonical-Financial-Operation.md` |
| Cost Basis Multi-Currency | `Cost-Basis-Engine.md` |
| Loan Day Count / Schedule | `Loan-Schedule-Engine.md` |
| fee.tiers vs `ln_loan_fee_tiers` | `JSON-Policy.md` · Loan feature — جدول typed SoT |
| Core Accounting ≠ Accounting UI | `Feature-Independence-Contract.md` · `Accounting-Core.md` |
| IranCore versioned | `iran/README.md` |
| Database Layers 01–04 | `Database-Layers.md` |
| Migration / preservation | `Migration-Data-Preservation.md` |

## P1 — قبل از MVP

| مورد | سند |
|------|-----|
| Corporate Actions | Stocks CA docs |
| Crypto C2C | Investment-Crypto |
| Historical FX / Price | Price-Fetching · Currency |
| Reconciliation جامع | `db/04-reconciliation-integrity.md` |
| Party model | `Parties.md` |
| Audit model | `Audit-vs-Financial-Event.md` |
| Offline Provider contracts | Technical-Architecture · PriceProvider |
| Calculation Engines مرز | `Calculation-Engines.md` |

## P2 — بعد از هسته

| مورد |
|------|
| License / Edition |
| Notifications |
| Budget / Goals |
| Tax |
| Online price sync |
| Cloud / backup پیشرفته |

## هشت سند محوری (مرجع سریع)

1. Canonical data / ownership — Ownership matrices + `Database-Layers.md`
2. `Field-Level-SoT.md`
3. `Canonical-Financial-Operation.md` + `Financial-Operation-Matrix.md`
4. `Feature-Independence-Contract.md` + `Cash-Settlement-Adapter.md`
5. `Calculation-Engines.md`
6. `iran/README.md` (Iran financial rules versioned)
7. `Migration-Data-Preservation.md`
8. Reconciliation + fixtures — `db/04-reconciliation-integrity.md` · `db/07-fixtures-release-gate.md`
