# Canonical Ownership Matrix

**تعداد جدول‌ها نگران‌کننده نیست.** خطر = یک مفهوم با دو حقیقت مستقل.

| مفهوم | مالک Canonical |
|--------|----------------|
| Bank Balance | Cash Ledger (`acc_transactions` rebuild) |
| Income detail | Income Domain + Journal lines |
| Expense detail | Expense Domain + Journal lines |
| Cash movement (bank) | Accounts / `acc_transactions` |
| Crypto platform cash | **`inv_crypto_cash`** (not parallel fin balance) |
| Brokerage cash | single brokerage cash ledger |
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
