# Source of Truth Matrix (یک سؤال → یک منبع)

Developer نباید بین لایه‌ها حدس بزند. **Snapshot هرگز SoT نیست.**

| سؤال | منبع حقیقت |
|------|------------|
| موجودی بانک | `acc_transactions` (rebuild balance) |
| موجودی / qty Crypto | `inv_crypto_transactions` (+ holding derived) |
| تعداد سهم | `inv_stocks_iran_transactions` |
| Units صندوق | `inv_fif_transactions` |
| موجودی طلا (mg) | `inv_metals_transactions` |
| مانده وام | `ln_transactions` |
| Income / Expense تخصصی UI | domain `inc_*` / `exp_*` |
| Trial Balance / گزارش میان‌فیچری | **`fin_journal_lines`** (+ `fin_accounts`) |
| Historical financial report | Journal lines |
| Net Worth / Portfolio value | **محاسبه** از holdings + prices + cash − liabilities (نه port_snapshots به‌عنوان SoT) |
| `currentBalance` / holding snapshot / `remainingBalance` | **فقط Cache** — از ledger rebuild |

```text
Domain Ledger  →  qty / cost / portions تخصصی Asset
Journal        →  گزارش حساب‌به‌حساب و میان‌فیچری
Cash Ledger    →  پول بانکی
Snapshot       →  optimization فقط
```

جزئیات: `Raw-vs-Derived-Data.md` · `Financial-Invariants` · `db/03-journal-sot-reporting.md`
