# Feature group: Investment

## Source of Truth
- Per sub-feature domain transaction tables + `fin_operations` / journal for posted financial effects.
- Holdings and cash balances on venues are **projections** unless Canonical-Cash-Model assigns a fin_account.

## Sub-features
| Path | SoT focus |
|------|-----------|
| 05-01 Crypto | inv crypto txs / holdings; venue cash per cash model |
| 05-02 Stocks Iran | stock txs + CA events; brokerage cash projection |
| 05-03 Fixed Income Funds | FIF txs; NAV vs transactionPrice separation |
| 05-04 Metals | metals txs; delivery → Physical Assets lineage |

## Dependencies (ports only)
- CostBasisEngine, CorporateActionEngine, CashSettlementPort, Price-Fetching, Currency-CrossRate, Tax (linkedTaxEventId)

## Vocabulary
- See `docs/core/NAMING-GLOSSARY.md` — operation vs domain transaction; reversed vs cancelled.

## Docs style
- Long formulas live in Core engines; this tree keeps contracts + fixtures.
