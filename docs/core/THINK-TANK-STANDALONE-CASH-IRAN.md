# Think-Tank notes — Standalone / Cash SoT / Iran-Crypto

**Date:** 2026-09-04  
**Decision authority:** concept homes below (not this note).

| Role finding | Decision |
|--------------|----------|
| Architect: Standalone needs journal without Accounts UI | **Yes** — via `LocalSettlementAdapter` into **real** `fin_journal_lines` |
| Architect: temp journal + migrate on license | **Rejected** — dual SoT / field loss risk |
| Accountant: only journal for cash balance | **Confirmed** in `Canonical-Cash-Model.md` |
| Accountant: `acc_transactions` not cash ledger | **Confirmed** in Accounts + Cash model |
| Holdings for cash balance | **Forbidden** — holdings = asset qty SoT domain |
| Iran T+2 timeline | **Added** to Settlement / Stocks docs |
| IRR vs Toman | **IRR only in DB** — `Money-Decimal-Policy.md` |
| Crypto fees / identity | **Matrix + instrumentId** in Investment-Crypto |

See: `Feature-Independence-Contract.md`, `Canonical-Cash-Model.md`, `Cost-Basis-Engine.md`.
