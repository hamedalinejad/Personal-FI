# Parties / Counterparties (طرف حساب — ساده، نه CRM)

برای حسابداری شخصی ایران، نام‌هایی مثل علی، موجر، کارفرما نباید فقط در `description` بمانند.

## جدول `ref_parties`

| فیلد | نقش |
|------|-----|
| `id` | UUID |
| `name` | نمایش |
| `type` | `person` \| `employer` \| `landlord` \| `tenant` \| `bank` \| `broker` \| `exchange` \| `business` \| `other` |
| `phone` | nullable |
| `nationalId` | nullable |
| `notes` | nullable |
| `linkedFinAccountId` | nullable — حساب تفصیلی اشخاص در `fin_accounts` |
| `isActive` | |
| `createdAt` | |

**Out of scope:** CRM، pipeline فروش، چند شرکت، permissions.

## اتصال

| دامنه | فیلد |
|-------|------|
| Loan lent/borrowed به شخص | `partyId` روی `ln_loans` |
| Income از کارفرما | `partyId` روی `inc_transactions` |
| Expense به موجر/شخص | `partyId` روی `exp_transactions` |
| Cheque | `partyId` اختیاری |
| Transfer توضیحی | memo + اختیاری partyId |

Journal: می‌تواند `fin_accounts` با `systemRole` مربوط به party داشته باشد (حساب اشخاص).

## گزارش‌های ممکن

- طلب از / بدهی به هر party
- گردش با یک شخص
- بدون پارس کردن متن description

---

## مفهوم مرکزی (نه per-Feature)

همه Featureها فقط `partyId → ref_parties` استفاده می‌کنند.

انواع: Person · Bank · Broker · Exchange · Fund · Company · Employer · Landlord · Tenant · Other

مثال‌ها: وام از علی، قرض به محمد، خرید از کارگزاری X، پرداخت به شرکت Y، خرید خودرو — همه `partyId` مشترک، نه جدول شخص جدا در هر Feature.
