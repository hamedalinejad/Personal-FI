# P0 Risk Register — باگ‌ها و ریسک‌های مرگبار

این سند **چک‌لیست قفل** است. قبل از شروع کد و قبل از هر release مالی باید همه ردیف‌ها ✅ باشند.

| # | ریسک | اثر | وضعیت مستند | سند کنترل‌کننده | قانون یک‌خطی |
|---|------|-----|-------------|-----------------|--------------|
| 1 | Float برای پول | خطای محاسباتی | ✅ قفل | `Financial-Invariants.md` · `JSON-Policy.md` · types | فقط TEXT decimal + decimal.js؛ ممنوع `number`/`z.number` برای پول |
| 2 | نبود دفترکل دوطرفه | گزارش غیرقابل اعتماد | ✅ قفل | `Accounting-Core.md` · `Canonical-Financial-Operation.md` | هر op مالی → `fin_journal_entries` + `fin_journal_lines`؛ Σ debit = Σ credit |
| 3 | ویرایش سند Posted | خراب شدن تاریخچه | ✅ قفل | `Canonical-Financial-Operation.md` · Invariants | Posted = immutable؛ اصلاح فقط Reversal/Correction + Audit |
| 4 | یکی بودن ریال و تومان | خطای مالی ایران | ✅ قفل | `Canonical-Cash-Model` · iran · Currency | Canonical = **IRR**؛ تومان = Display Unit فقط |
| 5 | نبود تاریخ تسویه جدا | خطای موجودی/سود | ✅ قفل | `Date-Semantics-Matrix.md` | Trade/businessDate ≠ settlementDate ≠ effective/paymentDate |
| 6 | حذف داده هنگام Import | از بین رفتن اطلاعات | ✅ قفل | `Import-Infrastructure.md` · `Import-Lineage.md` · Data-Preservation | Raw payload + unmapped fields حفظ؛ ممنوع CSV→Journal مستقیم |
| 7 | وابستگی اجباری وام به Accounts | نقض استقلال ماژول | ✅ قفل | `Cash-Settlement-Adapter.md` · Loan · Feature-Independence | SettlementPort؛ accountId nullable؛ external settlement |
| 8 | نبود Idempotency در API | ثبت دوباره | ✅ قفل | `Canonical-Financial-Operation.md` | `operationId` UNIQUE + commandHash؛ retry همان id |
| 9 | موجودی دستی به‌جای Ledger | اختلاف با تاریخچه | ✅ قفل | `Raw-vs-Derived` · `Rebuild-API-Contract` · Invariants | balance/holding از Ledger rebuild؛ snapshot هرگز SoT |

---

## جزئیات enforce برای پیاده‌سازی

### 1. Decimal
- DB: TEXT
- Domain: decimal.js
- Zod: string money schema / MoneyString branded
- CI fixture: جمع‌هایی که با float می‌شکنند باید با decimal پاس شوند

### 2. Journal
- بدون journal line متوازن، COMMIT مالی ممنوع
- Accounting UI اختیاری است؛ journal پشت‌صحنه اجباری

### 3. Posted immutable
```text
status=posted → هیچ UPDATE مبلغ/qty/date مالی
اصلاح = void/reversal operation جدید + operation جدید correction
```

### 4. IRR / Toman
```text
storageCurrency = IRR
displayUnit = rial | toman (×10 فقط UI)
```

### 5. Dates
| مفهوم | فیلد |
|--------|------|
| Trade / معامله | `tradeDate` / `businessDate` |
| Settlement / تسویه | `settlementDate` |
| Effective / اثر روی موجودی نقد | `paymentDate` / effective per domain |
| System | `createdAt` / `eventAt` |

### 6. Import preservation
```text
Raw file → staging row (همه ستون‌ها + unmapped JSON)
         → Operation
حذف ستون فایل در staging ممنوع؛ unmapped در raw/meta می‌ماند
```

### 7. Loan independence
```text
settlement.internal | settlement.external
capabilities.has('banking') ? AccountsCashAdapter : LocalSettlementAdapter
```

### 8. Idempotency
```text
Client: stable operationId قبل از اولین کلیک
Server/DB: UNIQUE(fin_operations.id)
duplicate → همان نتیجه قبلی
```

### 9. Balance from ledger
```text
currentBalance / remainingBalance / holding qty = DERIVED
rebuild* APIs اجباری
دستی وارد کردن موجودی نهایی بدون opening+ops = ممنوع به‌عنوان SoT
```

---

## Gate

بدون سبز بودن این ۹ مورد در review مستند + (بعداً) تست CI، **شروع implementation مالی یا release** معتبر نیست.

وضعیت کلی پروژه در برابر این لیست: **مستندات قفل‌اند**؛ کار باقی‌مانده enforce در کد روز اول است.
