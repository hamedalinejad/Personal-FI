# Cash Settlement Adapter (P0)

> **Invariant:** هیچ Feature مالی (Loan, Crypto, Stocks, Funds, Metals, …) **مستقیماً** به UI یا جداول داخلی Accounts وابسته نیست.  
> اتصال نقدی فقط از طریق **Port + Adapter** انجام می‌شود تا Editionهای تک‌فیچری (Loan-only و مشابه) واقعاً کار کنند.

## هدف

امکان‌پذیر کردن:

```text
Loan-only Edition
Crypto-only Edition
Fund-only Edition
Metal-only Edition
Stocks-only Edition
```

بدون اجبار به فعال بودن ماژول Accounts در UI یا schema کامل بانکی.

## الگوی اجباری

```text
Loan / Crypto / Stock / Fund / Metal
              ↓
     CashSettlementPort  (interface — Core)
              ↓
    ┌─────────┴─────────┐
    │                   │
AccountsCashAdapter   LocalSettlementAdapter
(اگر Accounts فعال)   (اگر Accounts خاموش / Edition محدود)
    ↓                   ↓
Accounts Feature      Local Settlement Account
                      (جدول/ledger محلی همان Feature
                       یا حساب تسویهٔ Core)
```

### نام‌گذاری

| مفهوم | نام |
|--------|-----|
| Interface | `CashSettlementPort` |
| پیاده‌سازی با Accounts | `AccountsCashAdapter` |
| پیاده‌سازی بدون Accounts | `LocalSettlementAdapter` |
| حساب محلی fallback | `Local Settlement Account` |

نام‌های قدیمی یا مستقیم `accounts.getBalance` از داخل Domain فیچر دیگر **ممنوع** است.

## قرارداد Port (حداقل)

```text
CashSettlementPort
  - postDebit(params)      // خروج نقد از سمت کاربر (پرداخت قسط، خرید، …)
  - postCredit(params)     // ورود نقد (واریز، فروش، …)
  - getAvailableBalance?(accountRef)  // اختیاری؛ برای validation
  - resolveAccountRef(ref) // نرمال‌سازی شناسه حساب
```

همهٔ فراخوانی‌ها **داخل** `runAtomicFinancialOperation` و از طریق Feature API همان دامنه انجام می‌شوند؛ UI هرگز Port را مستقیم صدا نمی‌زند.

## رفتار دو حالت

| حالت | Adapter | منبع نقد | نتیجه |
|------|---------|----------|--------|
| Accounts فعال | `AccountsCashAdapter` | `acc_accounts` / cash ledger Accounts | journal + لینک به تراکنش بانکی |
| Accounts خاموش / Edition تک‌فیچری | `LocalSettlementAdapter` | Local Settlement Account همان دامنه یا Core | journal کامل؛ بدون وابستگی به جداول Accounts |

در هر دو حالت:

- Accounting Core (journal lines) **همیشه** تولید می‌شود.
- Standalone UI ≠ بدون ledger/journal.

## اعمال اجباری برای

```text
Loan      ↔  CashSettlementPort
Crypto    ↔  CashSettlementPort
Stocks    ↔  CashSettlementPort
Funds     ↔  CashSettlementPort
Metals    ↔  CashSettlementPort
```

Income / Expense / Cheque / Transfer در صورت نیاز همین Port را استفاده می‌کنند وقتی نقد جابه‌جا می‌شود؛ جزئیات در Feature مربوطه.

## قوانین ممنوع

1. `import` مستقیم repository/API داخلی Accounts از Domain فیچر دیگر.
2. فرض کردن وجود `acc_accounts` برای صحت عملیات Loan/Crypto/…
3. نوشتن مستقیم در جداول Accounts از خارج Feature Accounts.
4. وابستگی UI Loan به route یا componentهای Accounts.

## قوانین مجاز

1. Feature از `CashSettlementPort` (Core) استفاده می‌کند.
2. در bootstrap اپ، بر اساس edition / feature flags یکی از Adapterها تزریق می‌شود.
3. گزارش‌های تخصصی فیچر بدون UI Accounts کار می‌کنند.
4. وقتی کاربر بعداً Accounts را روشن کند، داده‌های Local Settlement قابل reconcile/migration هستند (جزئیات migration در `db.md`).

## ارتباط با اسناد دیگر

| سند | نقش |
|-----|-----|
| `Module-Architecture.md` | لایه‌بندی کلی + ارجاع به این Port |
| `Feature-Independence-Contract.md` | Accounts = Optional |
| `Domain-Dependency-Matrix.md` | writes به Accounts فقط via Core/Port |
| `Canonical-Cash-Model.md` | مدل نقدی مشترک |
| `Accounting-Core.md` | journal همیشه |

## Edition Matrix (خلاصه)

| Edition | UI Accounts | Adapter پیش‌فرض | Journal |
|---------|-------------|------------------|---------|
| Loan-only | خاموش | LocalSettlementAdapter | بله |
| Crypto-only | خاموش | LocalSettlementAdapter | بله |
| Fund-only | خاموش | LocalSettlementAdapter | بله |
| Full | روشن | AccountsCashAdapter | بله |
| Full + Accounting UI | روشن | AccountsCashAdapter | بله + UI ledger |

**Standalone UI ≠ isolated database.** یک SQLite؛ مرز فقط در Port و feature flags است.
