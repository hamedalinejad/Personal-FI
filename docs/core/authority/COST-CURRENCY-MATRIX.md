---
id: DOC-AUTH-COST-CCY-MX
title: Cost / Valuation / Fee Currency Matrix
status: approved
version: 1.0
updated: 2026-09-12
---

| Feature | Cost pool currency | Valuation currency | Base currency | Transaction currency | Fee currency |
|---------|-------------------|--------------------|---------------|----------------------|--------------|
| Crypto | costCurrency (Model A) | valuation context | operation base | costCurrency | feeCurrency (explicit) |
| Funds | transactionCurrency | NAV/market separate | operation base | transactionCurrency | n/a on subscribe yet |
| Stocks | transaction (IRR V1) | market | base (=tx V1) | trade currency | fee in trade currency V1 |
| Metals | transaction currency | metal price context | base | transaction | feeCurrency; foreign fee ≠ cashOut sum |
| Loan | loan currency | n/a | base | loan currency | fee in loan ccy |

Base translation is always **derived** (`amountInBase`), never silently overwrites cost pool units.
