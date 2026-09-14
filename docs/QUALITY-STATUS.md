# QUALITY-STATUS

Live only. History in Git. **No new audit documents.**

| ID | Area | Status | Evidence |
|----|------|--------|----------|
| DOC | Owner tree | GOOD | DOCUMENTATION-STANDARD |
| HASH | Single commandHash | FIXED | economicHash.test |
| IDEM | Replay + conflict | FIXED | idempotencyConflict.test |
| DUR | Durability vocabulary | FIXED | schema + OFFLINE-RELEASE |
| REQ | Live matrix refs | FIXED | requirements-matrix-check |
| FRZ | FREEZE_PROVEN=false | LOCKED | status.registry |
| FX | amountInBase + crossRate | IMPROVING | amountInBase.test · crossRate.test |
| CRYPTO | buy/sell/transfer | PARTIAL | module + deferred list |
| IRAN-CAL | Equity weekend Thu+Fri v2 | FIXED | settlementPolicy.js |
| STOCKS | T+n / CA deferred | PARTIAL | module |
| FUNDS | NAV ≠ tx price | PARTIAL | module |
| METALS | purity/delivery | PARTIAL | module |
| LOAN | formulas | STRONG | modules/loan + scheduleEngine |
| BROWSER | sql.js RELEASE-PROVEN | OPEN | — |
| INV | Field inventory covers schema columns | GREEN | schema:inventory strict |
| FREEZE | semantic freeze | false | — |
| P0-01 | Book base ≠ txn currency | FIXED | bookSettings.resolveBookBaseCurrency |
| P0-03 | Fund no silent NAV price | FIXED | subscribe FUND_TRANSACTION_PRICE_REQUIRED |
| P0-04 | Capitalized fee has GL legs | FIXED | feeEngine journal |
| P0-05 | Reports posted-only GL | FIXED | generalLedger status filter |
| P0-06 | Settle uses book base + FX | FIXED | stocks/settle.js |
| P0-07 | Sell fee vocab = buy | FIXED | stocks/sell.js |
| P0-08 | Metals holding + purity key | FIXED | platform+instrument+purity_ratio |
| P0-09 | Delivery field persist | FIXED | physical_deliveries full columns |
| P1-01 | Schema live owner refs | FIXED | schema.sql header |
| P1-16 | Metals quoteBasis/unit | FIXED | metals/buy.js |
| P1-17 | Settle no PRAGMA probe | FIXED | locked related_operation_id |
| P1-18 | JSON persist requires opId | FIXED | worker.js |
| P2-01 | Semantic test names | FIXED | field-preservation* |
| PROD | Production | **NO_GO** | — |

### Remaining before RELEASE_PROVEN
- Full golden families with non-empty expected
- Recovery matrix all rows green
- Browser sql.js+IDB proof
- Field-inventory complete machine coverage
- Standalone edition packs complete

### Implementation sequence (locked)
Decimal/FX → Journal/invariants → Persistence → Loan→Crypto→Stocks→Funds→Metals → Planning/Tax/Reports → Browser → License → UI

## 2026-09-14 — Final grammar lock (§8–13)
Owner docs updated: FINANCIAL-CORE §20, API §10–12, OFFLINE §20, DATA-MODEL §20, modules loan/crypto/stocks/funds/metals/tax/accounts/cheque/income-expense/budget.
Production remains **NO-GO** until browser offline + recovery golden matrix + freeze evidence.
