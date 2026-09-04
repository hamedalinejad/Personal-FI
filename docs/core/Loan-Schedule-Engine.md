# Loan Schedule Engine (P0 architecture)

**قانون:** فرمول اقساط داخل `loanType` / `calculationMethod` **دفن نمی‌شود**.  
`calculationMethod` فقط **Product / Method template** است؛ ساخت و نگهداری جدول زمانی با **Schedule Engine** است.

```text
Loan (instance)
 ├── Product / Method          calculationMethod + loanType (template)
 ├── Principal                 principalAmount
 ├── Rate                      interestRate + interestType + rate history
 ├── Day Count                 dayCountConvention
 ├── Schedule Rules            frequency, dates, irregular periods
 ├── Fee Rules                 ln_loan_fees / Fee Engine
 ├── Grace Rules               periods و/یا date window — نه فقط months
 ├── Payment Rules             allocation, early pay, residual last
 └── Events                   rate change, holiday, reschedule, disbursement
```

```text
Loan Product (template)  ≠  Schedule Engine (runtime)
        │                         │
        └──── parameters ─────────┘
                    ↓
           ln_schedule_snapshots (نسخه‌دار)
                    ↓
           ln_transactions (پرداخت واقعی)
```

---

## ۱) لایه‌ها

| لایه | مسئولیت | SoT / خروجی |
|------|----------|-------------|
| **Loan Product / Method** | الگوی محاسبه: declining / flat / bullet / qarz | فیلدهای `ln_loans.calculationMethod` + defaults |
| **Schedule Engine** | تولید due dates، interest/principal portions، grace، holiday | `ln_schedule_snapshots` (DERIVED از params + events) |
| **Fee Engine** | origination، service، penalty طبق `Loan-Component-Classification` | fee lines + journal |
| **Payment Engine** | تخصیص پرداخت به interest/principal/fee/penalty | `ln_transactions` RAW |
| **Day Count Engine** | تبدیل نرخ و بازه زمانی به interest factor | pure function — بدون side effect |

**ممنوع:** `if (loanType === 'x') { hard-coded formula }` در UI یا بدون عبور از Schedule Engine.

---

## ۲) Day Count Convention (اجباری در Engine)

`annualRate / 12` یا `/ 52` یا `/ 4` **فقط میان‌بر Period-Based** است، نه تعریف کامل سود.

### enum `dayCountConvention`

| Code | معنی | کاربرد نمونه |
|------|------|--------------|
| `period_based` | نرخ دوره‌ای = `nominalAnnual / periodsPerYear` | اقساط منظم ماهانه/هفتگی ساده (پیش‌فرض بسیاری وام‌های مصرفی) |
| `actual_365` | سود بازه = principal × rate × actualDays / 365 | custom interval، پروداکت بانکی دقیق‌تر |
| `actual_360` | × actualDays / 360 | عرف برخی تسهیلات |
| `30_360` | هر ماه ۳۰ روز، سال ۳۶۰ | قراردادهای خاص |
| `actual_actual` | actualDays / daysInYear(year) | دقیق‌ترین؛ پیچیده‌تر |
| `custom_days` | مخرج صریح `dayCountDenominator` (مثلاً 365.25 یا عدد قرارداد) | قرارداد غیراستاندارد |

فیلدها:

| Field | Kind | Notes |
|-------|------|-------|
| `dayCountConvention` | RAW | اجباری؛ default پیشنهادی v1: `period_based` برای monthly/weekly/quarterly منظم؛ برای `custom` حداقل `actual_365` یا `custom_days` |
| `dayCountDenominator` | RAW nullable | فقط وقتی `custom_days` |
| `interestRatePeriod` | RAW | `annual` \| `monthly` — ورودی نرخ؛ تبدیل فقط داخل Engine |

### تبدیل نرخ (منطق Engine — نه کپی در Feature)

```text
function interestFactor(loan, periodStart, periodEnd):
  days = dayCountDays(loan.dayCountConvention, periodStart, periodEnd)
  if convention == period_based:
    r = nominalToPeriodRate(loan.interestRate, loan.interestRatePeriod, loan.installmentFrequency, loan.customIntervalDays)
    return r   // برای فرمول قسط ثابت؛ نه الزاماً days-based
  rateAnnual = toAnnualFraction(loan.interestRate, loan.interestRatePeriod)
  return rateAnnual * days / denominator(convention, periodStart, periodEnd)
```

**Period-Based shortcuts (فقط وقتی `dayCountConvention = period_based`):**

| frequency | periodsPerYear |
|-----------|----------------|
| monthly | 12 |
| weekly | 52 |
| quarterly | 4 |
| custom | `365 / customIntervalDays` (تقریبی) یا بهتر: از Day Count واقعی استفاده شود |

**قانون مستند:** هیچ کد Feature نباید `interestRate/12` را hard-code کند؛ فقط `DayCountEngine` / `getPeriodRate` / `interestFactor`.

---

## ۳) Schedule Rules

| مفهوم | فیلد / مدل | توضیح |
|--------|------------|--------|
| First Installment Date | `firstPaymentDate` | RAW — شروع جدول |
| Last Installment Date | `endDate` یا derived از n × frequency | می‌تواند از Engine محاسبه و validate شود |
| Irregular First Period | `irregularFirstPeriod` bool + `firstPeriodEndDate` | بازه اول ≠ طول استاندارد |
| Irregular Last Period | residual / stub last | قسط آخر residual (از قبل در Implementation-Pitfalls) |
| Payment frequency | `installmentFrequency` + `customIntervalDays` | monthly \| weekly \| quarterly \| custom |
| Holiday calendar | optional link IranCalendar | جابه‌جایی dueDate به business day — سیاست صریح |
| Rate change | `ln_rate_history` + Event | بازسازی snapshot از effectiveDate |
| Payment Holiday | Event یا grace subtype | توقف پرداخت بدون لزوماً interest-only |
| Reschedule | Event → snapshot version++ | |

```text
Schedule generation inputs:
  principal, method, rate series, dayCount,
  firstPaymentDate, frequency | custom days,
  totalInstallments OR endDate (یکی canonical؛ دیگری derived+validate),
  grace rules, fee rules affecting cash (نه لزوماً schedule principal)
```

خروجی: ردیف‌های `dueDate`, `principalPortion`, `interestPortion`, `feePortion?`, `status planned` داخل snapshot.

---

## ۴) Grace Rules (نه فقط `gracePeriodMonths`)

`gracePeriodMonths` به‌تنهایی برای weekly / quarterly / custom **ناکافی** است.

### مدل canonical

| Field | معنی |
|-------|------|
| `graceMode` | `none` \| `periods` \| `date_range` |
| `gracePeriods` | تعداد دوره‌های تنفس (با فرکانس خود وام) — canonical وقتی mode=periods |
| `gracePeriodUnit` | فقط `installment` (= period). **`month` deprecated برای منطق جدید** |
| `graceStartDate` | شروع تنفس (معمولاً = disbursement یا firstPayment) |
| `graceEndDate` | پایان تنفس (exclusive یا inclusive طبق قرارداد سند) |
| `graceInterestPolicy` | `interest_only` \| `payment_holiday` \| `capitalize` (v2) |

**Deprecated:** `gracePeriodMonths`, `gracePeriodCount` — فقط migration → `gracePeriods` با unit=installment.

### نگاشت Product × Grace

| Method | `interest_only` | `payment_holiday` |
|--------|-----------------|-------------------|
| declining_balance | ✅ پیش‌فرض تنفس | اختیاری اگر محصول بگوید |
| qarz_al_hasaneh | ❌ (سود صفر) | ✅ |
| flat_rate | ❌ v1 | ❌ v1 |
| bullet | ❌ v1 | ❌ v1 |

### مثال

```text
وام هفتگی → کاربر «۸ هفته تنفس» می‌خواهد
  graceMode = periods
  gracePeriods = 8
  // نه gracePeriodMonths = 2 با تبدیل تقریبی 8.666

وام با تنفس تقویمی ۱ فروردین تا ۳۱ خرداد
  graceMode = date_range
  graceStartDate / graceEndDate
  Engine: دوره‌هایی که dueDate داخل پنجره است = grace
```

---

## ۵) Events (ورودی Schedule Engine)

| Event | اثر |
|-------|-----|
| `disbursement` | شروع liability + cash journal |
| `rate_change` | `ln_rate_history`؛ rebuild future rows |
| `payment` / `early_payment` | RAW tx؛ optionally rebuild |
| `payment_holiday` | علامت دوره‌ها؛ سیاست سود |
| `fee_charge` / `penalty` | Fee rules |
| `reschedule` | snapshot جدید |
| `write_off` / `close` | پایان |

همهٔ تغییرات ساختاری schedule → **`ln_schedule_snapshots.version++`** (جدول از قبل Must است).

---

## ۶) Fee Rules vs Schedule

کارمزدها طبق `Loan-Component-Classification.md` و `Fee-Treatment-Matrix.md`:

- ممکن است روی **cash at disbursement** اثر بگذارند (net received) نه روی principal schedule
- ممکن است قسط‌بندی شوند (سطر fee در schedule)
- Schedule Engine fee را از **Fee Rules** می‌گیرد؛ داخل `if method == flat` hard-code نمی‌کند

---

## ۷) API منطقی Engine (مستند پیاده‌سازی)

```text
buildInitialSchedule(loanId) → snapshot v1
rebuildScheduleFrom(loanId, effectiveDate, reason) → snapshot vN
previewSchedule(params) → rows بدون persist  // برای UI قبل از commit
getPeriodRate(loan) → فقط وقتی dayCount=period_based
interestFactor(loan, start, end) → Day Count path
applyGrace(rows, graceRules) → tag periods
applyRateChange(loanId, newRate, effectiveDate)
```

Invariant:

```text
Σ planned principal portions (non-grace amortization phase) = principalAmount
  (± residual last installment policy)
Snapshot هرگز SoT پرداخت واقعی نیست — ln_transactions است
remainingBalance = DERIVED از ln_transactions
```

---

## ۸) v1 Method set (بدون دفن فرمول)

| Method | نقش Product | Schedule Engine |
|--------|-------------|-----------------|
| `declining_balance` | قسط ثابت؛ سود روی مانده | amortization + day count + grace interest_only |
| `flat_rate` | سود کل از ابتدا روی P | portions ثابت |
| `bullet` | سود دوره‌ای؛ اصل آخر | |
| `qarz_al_hasaneh` | سود ۰؛ اصل یکنواخت | grace = holiday |

روش‌های بعدی (`step_up`, `balloon`, …) = **Product جدید** + همان Engine با rules بیشتر — نه fork جدا.

---

## ۹) ارتباط اسناد

| سند | نقش |
|-----|-----|
| `features/04-Debt-Loan-Management/Debt-Loan-Management.md` | فیلدها، API فیچر، فرمول‌های مرجع |
| **این فایل** | معماری Engine جدا از Product |
| `Loan-Component-Classification.md` | principal / interest / fee / penalty |
| `Implementation-Pitfalls.md` | residual last installment، qarz dual journal |
| `iran/IranLoanConventions` | پیش‌فرض‌های عرف ایران برای day count/grace |
| `Field-Level-Data-Ownership-Matrix.md` | schedule snapshot = DERIVED |

---

## ۱۰) قوانین برنامه‌نویس

1. فرمول جدید → در Day Count / Schedule Engine؛ نه در `loanType` switch در UI.
2. Grace جدید → `graceMode` periods یا date_range؛ نه فقط months.
3. هر rate change / reschedule → snapshot version جدید.
4. fixtureهای `loan_*` در `db/07-fixtures-release-gate.md` باید day count و grace periods را پوشش دهند.

## Cross-locks (LN-001…007, 011, 012)

Variable rate by **accrual interval**; explicit dayCount vs period mode; grace capitalize/forgive flags; component-level outstanding; immutable schedule versions on early pay/restructure; final principal exact; explicit penalty accrual policy. See `LOAN-LN-001-015-LOCKS.md`.

## P0-FINAL-027/028

Schedule = projection; accrual posts only via accrual/payment events. Variable-rate fixture: `Financial-Invariants.md`.

