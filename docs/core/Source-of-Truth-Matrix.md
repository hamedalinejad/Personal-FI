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

## جدول Raw / Derived / Rebuild

| Concept | Raw Source | Derived | Rebuild From |
|---------|------------|---------|--------------|
| Bank Balance | acc_transactions | currentBalance | acc_transactions |
| Journal Balance | fin_journal_lines | — | journal |
| Crypto Qty | inv_crypto_transactions | holding | crypto ledger |
| Loan Balance | ln_transactions | remainingBalance | ln_transactions |
| Net Worth | ledgers + valuation | snapshot | all canonical |
| Portfolio Value | holdings + prices + FX | snapshot | same |

---

## قانون: هر موجودی فقط یک Domain SoT

**ممنوع:** دو جدول balance مستقل برای یک پول (مثلاً Binance $1000 هم در `inv_crypto_cash` و هم به‌عنوان balance مستقل در `fin_accounts` بدون اینکه journal projection باشد).

| موجودی | Domain SoT (qty/balance) | Accounting projection |
|--------|--------------------------|------------------------|
| Bank Cash | `acc_transactions` | `fin_accounts` + journal lines |
| Crypto Exchange/Wallet **Cash** | **`inv_crypto_cash` ledger/tx** | journal lines → linked `fin_accounts` (systemRole=exchange_cash) **derived** |
| Crypto **Asset** qty | `inv_crypto_transactions` | journal asset accounts derived |
| Brokerage Cash (سهام/ETF) | **یک** brokerage cash ledger | journal derived |
| Stock qty | `inv_stocks_iran_transactions` | journal derived |
| Fund units | `inv_fif_transactions` | journal derived |
| Loan balance | `ln_transactions` | journal liability/receivable derived |

```text
Domain SoT  =  حقیقت موجودی
fin_accounts / journal  =  نمای حسابداری همان حرکت (نه موجودی دوم)
Snapshot  =  cache
```

اگر `inv_crypto_cash = 1000` و journal/fin نشان دهد 998 → **reconcile**؛ Domain cash ledger برنده برای qty؛ journal برای trial balance — drift = integrity issue نه دو SoT موازی.

`fin_accounts` برای exchange cash = **آینه حسابداری** با `linkedEntityType/Id` به crypto cash account — balance از domain rebuild می‌شود، نه write مستقل موازی.

**تأکید:** `currentBalance`, `remainingBalance`, `quantity` holding, `averageBuyPrice`, `totalInvested`, `portfolioValue` = **cache/derived** — هرگز SoT.

## Reports

```text
Ledger → Calculation → Report
```

**ممنوع:** Report مستقیم از Snapshot به‌عنوان SoT. Snapshot فقط cache؛ rebuild از ledger.


جزئیات فیلد: `Field-Level-Data-Ownership-Matrix.md` · هویت دارایی: `Instrument-Identity.md`
