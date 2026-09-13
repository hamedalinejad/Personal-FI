---
id: DOC-AUTH-DATA-OWNERSHIP
title: Final Data Ownership, Identity, Precision & Domain Models
status: approved
version: 1.0
updated: 2026-09-12
authority: binding
---

> **SUPERSEDED as authority** — see docs/FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, modules/*.


# 11. Final data ownership rule

| Layer | Truth |
|-------|--------|
| **Accounting** | `fin_journal_lines` |
| **Cash** | Core accounts + journal |
| **Feature history** | `inv_*` / `ln_*` transaction rows |
| **Snapshots** | holding, portfolio, average cost, remaining balance — **derived & rebuildable** |

# 12. Financial identity

| Feature | Identity key |
|---------|----------------|
| Crypto | `instrumentId` + venue/network scope |
| Stocks | `instrumentId` + brokerage/account scope |
| Funds | `instrumentId` + account/portfolio scope |
| Metals | `instrumentId` + platform/account scope |

Do **not** rebuild history from symbol alone.

# 13. Financial precision

All money/qty/rate/price: **decimal strings**.  
Forbidden: JavaScript `Number`, IEEE float, implicit numeric coercion for finance.

# 14. Toman

- Storage currency: **IRR**  
- Display: Rial / Toman  
- Toman is **never** a second ledger currency.

# 15. Fee model

One event: `CanonicalFeeEvent` with:

```text
feeAmount, feeCurrency, feeInstrumentId?, feeTreatment,
feeFundingAsset?, feeIncludedInQuantity
```

Exactly **one** economic treatment per event. Features select policy; Core Fee Engine applies.

# 16. FX model

Supported modes: direct, inverse, multi-hop, historical as-of, missing rate, stale observation, manual rate, cached rate.  
Historical reconstruction **must never** use “latest now”.

# 17. Price model

- Transactions: **recorded transaction price**  
- Valuation: `price_history` + `ValuationContext`  
- Provider availability must not block transaction correctness.

# 18. Loan model

Components: principal, interest, fee, penalty.  
Payment allocation **explicit**. Schedule **versioned**. Remaining balance derived/rebuildable.

# 19. Stock Iran model

Keep separate: `tradeDate`, `businessDate`, `settlementDate`, `marketDate`.  
Support: commission, tax-like charge, other fee, dividend, CA, rights, split, bonus, broker transfer, write-off.

# 20. Funds model

Never conflate: NAV, transactionPrice, marketPrice, valuationPrice.  
Acquisition cost follows **transaction-price policy**.

# 21. Metals model

Keep separate: quantityMg, gross, purity, fineWeightMg, metal value, premium, making/labor, fee, delivery fee.  
Coin vs bullion: explicit instrument semantics.

# 22. Standalone editions

Allowed: Loan-only, Crypto-only, Fund-only, Stocks-only, Metals-only, Accounting-only (future), Full.

Standalone = no dependency on **unrelated UI/modules**.  
Standalone ≠ no journal / no Core / second ledger / second cash truth.

# 23. License transitions

- Upgrade Loan-only → Full: expose existing history immediately.  
- Downgrade Full → Loan-only: **must not delete** hidden data.  
- License changes capabilities/UI only — never erase accounting truth.

# 24. Pages

Keep top-level: Home, Money, Transactions, Investments, Loans, More.  
Operations: Sheet / Drawer / Dialog. **Feature ≠ Page.**
