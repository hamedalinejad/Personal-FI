# Canonical Ownership Matrix

**تعداد جدول‌ها نگران‌کننده نیست.** خطر = یک مفهوم با دو حقیقت مستقل.

| مفهوم | مالک Canonical |
|--------|----------------|
| **Any Cash Balance** | **`fin_journal_lines` + `fin_accounts`** (`Canonical-Cash-Model.md`) |
| Income detail | Income Domain + Journal lines |
| Expense detail | Expense Domain + Journal lines |
| Cash movement (bank) | Journal lines + `acc_transactions` event (نه balance موازی) |
| Crypto / exchange / wallet **cash** | **`fin_accounts` (systemRole=exchange_cash/wallet_cash) + journal**؛ `inv_crypto_cash` فقط projection |
| Brokerage cash | `fin_accounts` (systemRole=broker_cash) + journal |
| Crypto Holding qty | Crypto Domain Ledger |
| Loan Outstanding | Loan Domain Ledger (`ln_transactions`) |
| Book Cost / average cost | Cost Basis Engine (derived from domain) |
| Portfolio Value | Valuation / Portfolio Engine (calc) |
| FX rate | Currency Engine + rate tables |
| Market Price | `price_history` |
| Accounting / Trial Balance | **Journal lines** (`fin_journal_lines`) |
| Cross-feature report | Journal + engines |
| Snapshot (`port_*`, balances) | **Cache only** — rebuild از ledger |

```text
اگر دو جدول برای یک سؤال جواب متناقض دادند → مالک این ماتریس برنده است.
```
