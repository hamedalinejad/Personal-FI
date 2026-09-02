# Cross-Cutting Contracts Batch 2 (Stale / Calendar / Scheduler / Reports / Cost / CA)

قفل مشترک — در تعارض با Feature prose قدیمی، این سند + Core engines برنده است.

---

## 1. Stale policy — configurable, canonical per asset class

هر asset class (stocks, crypto, funds/NAV, metals, FX, physical mark) یک **StalePolicy** canonical دارد:

```text
StalePolicy {
  assetClass: string
  freshWithin: duration | businessDays   // e.g. 1 business day, 15 minutes
  staleAfter: duration | businessDays
  onStale: 'flag' | 'block_valuation_only' | 'use_last_with_flag'
  calendar?: 'market' | 'user' | 'utc'     // for business-day counts
  version: string
}
```

- قابل تنظیم در settings per class (با defaultهای sensibile).
- Valuation / portfolio **باید** `staleState` و policy version را برگردانند.
- یک global stale برای همه کلاس‌ها ممنوع؛ override فقط از طریق همین schema.

---

## 2. Tax year + calendar system

`taxYear` به‌تنهایی کافی نیست.

```text
TaxPeriod {
  calendar: 'jalali' | 'gregorian' | 'other'
  year: number              // 1404 with jalali, 2025 with gregorian
  periodKey: string         // stable e.g. "jalali:1404" | "gregorian:2025"
  startDate: DATE           // civil bounds in ISO or dual
  endDate: DATE
}
```

- UI ایران: پیش‌فرض Jalali؛ export/API همیشه `calendar` + `year` دارد.
- گزارش مالیاتی بدون `calendar` = invalid.

---

## 3. Budget period — timezone & business calendar

Budget `startDate` / `endDate` / month boundaries:

- از **timezone کاربر** (settings) برای «روز» استفاده می‌کنند.
- اختیاری: business calendar (تعطیلات) فقط برای reminder/due نمایش؛ allocation ماه از civil month در TZ کاربر است مگر policy صریح `business_month`.
- `periodKey` پایدار: مثلاً `2026-09@Asia/Tehran` یا Jalali equivalent با calendar tag.
- ساخت دوره بعد (rollover) همان TZ/calendar را به ارث می‌برد.

---

## 4. Goal monthly recommendation — day-count policy

پیشنهاد واریز ماهانه تا رسیدن به `targetAmount` تا `deadline`:

```text
remaining = targetAmount - currentAmount
monthsRemaining = policy.monthCount(today, deadline)
  // policies: calendar_months | full_months_only | days/30.436875 | days/30
recommendedMonthly = remaining / max(monthsRemaining, 1)
```

- `dayCountPolicy` / `monthCountPolicy` روی goal یا settings نسخه می‌شود.
- بدون policy مشخص، API recommendation برنمی‌گرداند یا default مستند (`calendar_months`) با flag.

---

## 5. Recurring scheduler — catch-up policy

اگر job چند روز اجرا نشد:

```text
catchUpPolicy:
  'single_latest'      // یک occurrence برای آخرین due ردشده (merge)
  | 'all_missed'       // یک occurrence per missed period
  | 'skip_missed'      // فقط از due بعدی به جلو
```

- Policy روی `br_items` یا global bills settings؛ default پیشنهادی: `all_missed` برای صورتحساب، قابل تغییر.
- هر occurrence تولیدشده `scheduledOccurrenceKey` یکتا دارد (جلوگیری از duplicate پس از catch-up).
- هم‌راستا با UNIQUE(templateId, scheduledOccurrenceKey).

---

## 6. Notifications — expiration, retention, dedupe schema

| Concern | Rule |
|---------|------|
| Dedupe | UNIQUE(`dedupeKey`) مستقل از read (قبلاً P0-076) |
| `dedupeKey` schema | `{category}:{relatedFeature}:{relatedId}:{eventKind}:{occurrenceKey?}` مستند و پایدار |
| Expiration | `expiresAt` اختیاری؛ بعد از آن در inbox فعال نیاید |
| Retention | policy: purge soft-deleted / expired after N days (settings); financial audit جداست |
| Read state | روی retention dedupe اثر ندارد |

---

## 7. Reports API — current vs as-of vs period vs since-inception

هر report endpoint مالی صریحاً یکی (یا ترکیب typed) را می‌گیرد:

| Mode | معنی |
|------|------|
| `current` | آخرین state شناخته‌شده (با stale flags) |
| `asOf` | reconstruction در یک تاریخ |
| `period` | `{ from, to }` — activity / return در بازه |
| `sinceInception` | از اولین opening/activity تا `to` یا now |

```text
ReportQuery {
  mode: 'current' | 'asOf' | 'period' | 'sinceInception'
  asOf?: DATE
  from?: DATE
  to?: DATE
  cashScope?: ...
}
```

مبهم بودن «گزارش بدون mode» ممنوع.

---

## 8. Investment P&L bridge components

P&L دوره‌ای سرمایه‌گذاری **باید** اجزا را جدا نگه دارد (نه یک عدد واحد):

```text
openingPositionQty / openingCost
+ purchases (qty, cost)
- sales (qty, cost released, realizedPnL)
± corporate actions / transfers (qty, cost adjustments)
= closingPositionQty / closingCost
closingValuation (priceAsOf)
unrealizedPnL = closingValuation - closingCost
periodRealizedPnL = sum sales realized (+ CA realized if any)
```

Reports/Portfolio از همین bridge استفاده می‌کنند (P0-090 metrics).

---

## 9. Cost basis method — per asset class + version on operation

- Default method per asset class در settings: `weighted_average` | `fifo` | … (طبق Cost-Basis-Engine).
- Override per holding مجاز (nullable).
- هر operation که cost را لمس می‌کند در payload/engine metadata:

```text
engineVersions: {
  costBasis: 'wa-v1' | 'fifo-v1' | ...,
  rounding: policyVersion,
  ...
}
```

- تغییر method از تاریخ مشخص فقط با rebuild policy مستند؛ تاریخچه op با version همان op replay می‌شود.

---

## 10. Stock CA fractional rounding — instrument precision + market rule

- `fractionalPolicy` روی CA (قبلاً P0-056) + **precision** از instrument registry (lot size / quantity decimals).
- Market rule adapter (Iran market rules): حداقل واحد، گرد کردن entitlement، cash-in-lieu tick.
- ترتیب: apply ratio → instrument precision → fractionalPolicy → optional cash-in-lieu leg.
- بدون precision/market rule، engine reject یا default امن (`round_down` + audit warning).

---

## Feature author checklist

1. StalePolicy per asset class registered  
2. Tax periods carry calendar + year  
3. Budget periods use user TZ (+ documented calendar)  
4. Goal recommendation exposes monthCountPolicy  
5. Bills catchUpPolicy explicit  
6. Notification dedupeKey schema + expiresAt/retention  
7. ReportQuery.mode required  
8. Investment period P&L bridge components  
9. costBasis method + engineVersions on ops  
10. CA fractional uses instrument precision + market rules  

