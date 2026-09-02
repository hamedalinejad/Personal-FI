# Source of Truth Matrix (یک سؤال → یک منبع)

Developer نباید بین لایه‌ها حدس بزند. **Snapshot هرگز SoT نیست.**

| سؤال | منبع حقیقت |
|------|------------|
| **هر موجودی نقد** (بانک، صرافی، کارگزاری، کیف، صندوق نقد) | **`fin_journal_lines` روی `fin_accounts` نقد** (rebuild با Decimal Engine) — ببین `Canonical-Cash-Model.md` |
| موجودی بانک (رویداد عملیاتی / UI بانک) | `acc_transactions` = event log؛ مانده = همان journal حساب `bank_cash` |
| موجودی / qty Crypto **Asset** | `inv_crypto_transactions` (+ holding derived) |
| تعداد سهم | `inv_stocks_iran_transactions` |
| Units صندوق | `inv_fif_transactions` |
| موجودی طلا (mg) | `inv_metals_transactions` |
| مانده وام | `ln_transactions` |
| Income / Expense تخصصی UI | domain `inc_*` / `exp_*` |
| Trial Balance / گزارش میان‌فیچری | **`fin_journal_lines`** (+ `fin_accounts`) |
| Historical financial report | Journal lines |
| Net Worth / Portfolio value | **محاسبه** از holdings + prices + **cash از journal** − liabilities (نه port_snapshots به‌عنوان SoT) |
| `currentBalance` / holding snapshot / `remainingBalance` / `inv_crypto_cash.balance` | **فقط Cache** — از journal (نقد) یا asset ledger rebuild |

```text
Asset Domain Ledger  →  qty / cost / portions تخصصی Asset (نه نقد)
Journal + fin_accounts →  **تنها SoT نقد** و گزارش حساب‌به‌حساب
Domain cash tables     →  event / projection — نه balance موازی
Snapshot               →  optimization فقط
```

جزئیات: `Raw-vs-Derived-Data.md` · `Financial-Invariants` · `db/03-journal-sot-reporting.md`

## جدول Raw / Derived / Rebuild

| Concept | Raw Source | Derived | Rebuild From |
|---------|------------|---------|--------------|
| Cash Balance (any) | fin_journal_lines | currentBalance / domain projection | journal lines (Decimal Engine) |
| Bank events | acc_transactions | — | — |
| Journal Balance | fin_journal_lines | — | journal |
| Crypto **Asset** Qty | inv_crypto_transactions | holding | crypto asset ledger |
| Loan Balance | ln_transactions | remainingBalance | ln_transactions |
| Net Worth | ledgers + valuation | snapshot | all canonical |
| Portfolio Value | holdings + prices + FX | snapshot | same |

---

## قانون: نقد یک SoT — دارایی یک Domain Ledger

**ممنوع (P0):** دو balance مستقل برای یک پول (مثلاً Binance USDT هم در `inv_crypto_cash.balance` و هم `fin_accounts` بدون اینکه یکی cache محض باشد).

| موجودی | SoT مانده | نقش Domain |
|--------|-----------|------------|
| **همه انواع Cash** (Bank / Exchange / Broker / Wallet / Cashbox) | **`fin_journal_lines` + `fin_accounts`** | `acc_transactions` / `inv_crypto_cash` فقط event یا projection |
| Crypto **Asset** qty | `inv_crypto_transactions` | holding derived |
| Stock qty | `inv_stocks_iran_transactions` | holding derived |
| Fund units | `inv_fif_transactions` | holding derived |
| Metal qty | `inv_metals_transactions` | holding derived |
| Loan balance | `ln_transactions` | journal liability derived |

```text
Cash SoT     = fin_accounts + fin_journal_lines
Asset SoT    = inv_*_transactions (qty تخصصی)
Domain cash  = projection / metadata (اختیاری) — هرگز ledger موازی
Snapshot     = cache
```

اگر `inv_crypto_cash.balance = 1000` و journal همان `finAccountId` نشان دهد 998 → **journal برنده**؛ projection باید rebuild شود. drift = integrity bug.

جزئیات کامل: **`Canonical-Cash-Model.md`**

**تأکید:** `currentBalance`, `remainingBalance`, `quantity` holding, `averageBuyPrice`, `totalInvested`, `portfolioValue`, `inv_crypto_cash.balance` = **cache/derived** — هرگز SoT.

## Reports

```text
Ledger → Calculation → Report
```

**ممنوع:** Report مستقیم از Snapshot به‌عنوان SoT. Snapshot فقط cache؛ rebuild از ledger.


جزئیات فیلد: `Field-Level-Data-Ownership-Matrix.md` · هویت دارایی: `Instrument-Identity.md`

## P0-FINAL-048 / 049 — Report integrity

- Every historical report carries `ReportCalculationContext` (asOf, priceAsOf, fxAsOf, engineVersions, staleStatus, …) — see `P0-FINAL-041-051-LOCKS.md`.
- `calculatedProfit` ≠ `externalReportedProfit`; export keeps both separate.
