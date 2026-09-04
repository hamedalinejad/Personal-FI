# License Gate

**جدا از Financial DB.** لایسنس هرگز journal، history، یا domain ledger را پاک/بازنویسی نمی‌کند.  
مرتبط: `License-Offline.md` · `Feature-Independence-Contract.md` · `ARCHITECTURE-LOCKED.md`

---

## هدف تجاری

فروش editionهای مستقل (مثلاً فقط وام) بدون از دست رفتن داده هنگام ارتقا.

---

## سطوح نمونه (قابل پیکربندی محصول)

| سطح | قابلیت‌های نمونه | توضیح |
|-----|------------------|--------|
| **Free** | ماشین‌حساب وام / سود مرکب (اختیاری: بدون persist) | می‌تواند `capabilities.persistFinance=false` باشد |
| **Basic** | Accounts + Income + Expense + Transfer | حسابداری شخصی روزمره |
| **Pro** | + Crypto / Stocks / Funds / Metals | پرتفوی |
| **Enterprise** | + گزارش پیشرفته، Tax، Export کامل، multi-edition | حرفه‌ای |

نام سطوح و بسته‌ها **محصول‌اند**؛ موتور فقط `capabilities` می‌فهمد.

---

## مدل capability (نه hard-code نام فیچر در همه جا)

```text
LicenseDocument (signed, offline-verifiable)
  → LicenseGate.resolve()
  → CapabilitySet {
      features: { loan, accounts, crypto, stocks, fif, metals, tax, reports, ... }
      mode: disabled | standalone | integrated
      persistFinance: boolean
      export: boolean
      ...
    }
```

### سه حالت هر Feature

| Mode | معنی |
|------|------|
| **disabled** | Public API commandها `LICENSE_FEATURE_DISABLED`؛ UI مخفی/قفل |
| **standalone** | Feature UI فعال؛ Journal واقعی Core از طریق LocalSettlementAdapter؛ بدون اجبار Accounts UI |
| **integrated** | + Accounts/Reporting UI و مسیرهای یکپارچه در صورت وجود |

```text
integrated  ⊇  standalone journal behavior
disabled    ≠  delete data
```

---

## قرارداد API

```typescript
// Conceptual — transport-agnostic
interface LicenseGate {
  /** Call at app start and before sensitive commands */
  getCapabilities(): CapabilitySet;
  assertFeature(featureId: string, action: 'command' | 'query' | 'ui'): void;
  /** Never mutates financial rows */
  refreshFromLicenseFile(file: LicenseDocument): void;
}

// Feature command entry (every mutating API):
function createLoan(cmd) {
  licenseGate.assertFeature('loan', 'command');
  return runAtomicFinancialOperation(...);
}
```

### قوانین

1. هر **command** مالی در ابتدای مسیر `assertFeature` می‌شود.
2. **Query** روی دادهٔ موجود می‌تواند برای دادهٔ از قبل ذخیره‌شده در edition قبلی read-only بماند (سیاست محصول)؛ یا قفل شود — باید در CapabilitySet صریح باشد. پیش‌فرض پیشنهادی: **خواندن تاریخچهٔ موجود مجاز، command جدید قفل**.
3. `disabled` → پاسخ API خطا با `retryable: false`, `userActionRequired: true` (ارتقا لایسنس).
4. لایسنس **خارج** از SQLite مالی است (`license.json` / store جدا).
5. انقضای لایسنس → capability محدود؛ **نه** wipe دیتابیس.

---

## Standalone vs Integrated (هم‌تراز Independence Contract)

```text
standalone loan:
  Loan UI → API → Operation → ln_* → LocalSettlementAdapter → fin_journal_lines

integrated:
  همان pipeline + Accounts UI و گزارش‌های کامل روی همان journal
```

هیچ «ژورنال موقت برای Free» جدا از Core وجود ندارد اگر `persistFinance=true`.  
اگر Free فقط ماشین‌حساب است (`persistFinance=false`)، اصلاً Operation مالی persist نمی‌شود.

---

## Acceptance

| سناریو | انتظار |
|--------|--------|
| Free + persistFinance=false | محاسبه OK؛ هیچ row مالی |
| Basic بدون Pro | crypto.commands.buy → LICENSE_FEATURE_DISABLED |
| ارتقا Basic→Pro | تاریخچه Basic intact؛ crypto فعال |
| انقضای Pro | command قفل؛ داده باقی |
