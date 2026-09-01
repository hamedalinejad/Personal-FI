نام فیچر: Cheque Management
توضیح کلی:
این فیچر مسئولیت کامل مدیریت چک‌های پرداختی و دریافتی را بر عهده دارد.
چک‌ها دارای وضعیت (در انتظار، وصول‌شده، برگشتی و ...) هستند و هنگام تغییر وضعیت، تراکنش مالی مربوطه به صورت خودکار ثبت می‌شود.

User Stories
Must Have:

ثبت چک جدید (پرداختی یا دریافتی)
ثبت اطلاعات کامل چک (شماره چک، مبلغ، تاریخ سررسید، بانک، حساب مرتبط و ...)
تغییر وضعیت چک (در انتظار → وصول‌شده / برگشتی / ابطال)
ثبت خودکار تراکنش هنگام وصول یا برگشت چک
مشاهده لیست چک‌ها با فیلتر (وضعیت، تاریخ سررسید، نوع، حساب)
یادآوری سررسید چک‌ها
مشاهده مجموع چک‌های در جریان (پرداختی و دریافتی)

Should Have:

افزودن تصویر چک
جستجوی پیشرفته
گزارش چک‌های برگشتی


Business Rules

چک می‌تواند از نوع پرداختی (صادر شده توسط کاربر) یا دریافتی (دریافت‌شده از دیگران) باشد.
ارز چک همیشه با ارز حساب مرتبط یکی است.
هنگام ثبت چک، نرخ تبدیل لحظه ثبت (نسبت به baseCurrency کاربر) ذخیره می‌شود.
چک در ابتدا با وضعیت pending ثبت می‌شود.
هنگام وصول چک:
اگر دریافتی باشد → تراکنش deposit-cheque ایجاد و مانده حساب افزایش می‌یابد.
اگر پرداختی باشد → تراکنش withdrawal-cheque ایجاد و مانده حساب کاهش می‌یابد.

هنگام برگشت چک، وضعیت به bounced تغییر می‌کند:
- اگر چک هنوز pending بوده و مستقیماً bounced شده → هیچ تراکنشی ثبت نشده، پس نیازی به معکوس نیست.
- اگر چک قبلاً cleared شده بوده (پول جابه‌جا شده) و بعداً واقعاً برگشت خورده → حتماً باید تراکنش معکوس (reversal) ثبت شود.
- سیستم باید به صورت خودکار تراکنش reversal ایجاد کند:
 - در `acc_transactions`: `isVoided = true` و `relatedTransactionId` به تراکنش اصلی تنظیم می‌شود
 - در `chk_cheques`: `reversalTransactionId` به تراکنش reversal تنظیم می‌شود
- اگر چک به cancelled تغییر وضعیت دهد (حذف قبل از وصول) → فقط `status` تغییر می‌کند و هیچ تراکنشی ثبت نمی‌شود.
موجودی حساب نمی‌تواند منفی شود.
ویرایش چک فقط در وضعیت pending مجاز است.
حذف فیزیکی وجود ندارد — فقط تغییر وضعیت به cancelled.


Domain Entities
### ۱. Cheque (جدول: `chk_cheques`)

- `id` → UUID (Primary Key)
- `type` → string (payable یا receivable)
- `chequeNumber` → string (شماره چک)
- `sayadiTrackingCode` / `sayadId` → string (شناسه صیادی، معمولاً ۱۶ رقم — nullable)
- `sayadInquiryStatus` → string nullable
- `bankBranchCode` → string nullable
- `endorsedToPartyId` → UUID nullable
- `amount` → decimal (مبلغ چک)
- `currency` → string (ارز چک = ارز حساب)
- `exchangeRateToBase` → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت (نه الزاماً ریال/تتر — قرارداد کامل در `Currency-CrossRate.md`))
- `accountId` → UUID (حساب مرتبط)
- `bankName` → string (بانک صادرکننده)
- `issueDate` → datetime (تاریخ صدور)
- `dueDate` → datetime (تاریخ سررسید)
- `status` → string (pending, cleared, bounced, cancelled)
- `payeeOrPayer` → string (طرف مقابل)
- `description` → string (توضیحات)
- `hasAttachment` → boolean
- `attachmentPath` → string (تصویر چک)
- `clearedDate` → datetime (تاریخ وصول — nullable)
- `accountTransactionId` → UUID (شناسه تراکنش مرتبط در `acc_transactions` — nullable)
- `reversalTransactionId` → UUID (شناسه تراکنش reversal هنگام برگشت چک — nullable)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته طراحی**: 
> - وقتی چک برمی‌گردد (bounced)، سیستم یک تراکنش reversal ایجاد می‌کند 
> - این تراکنش در `acc_transactions` با `isVoided = true` ثبت می‌شود 
> - `reversalTransactionId` در `chk_cheques` به این تراکنش reversal لینک می‌شود 
> - `relatedTransactionId` در تراکنش reversal به تراکنش اصلی لینک می‌شود

۲. Transaction (جدول مشترک acc_transactions)

هنگام وصول چک، تراکنش مربوطه با نوع deposit-cheque یا withdrawal-cheque ایجاد می‌شود.


APIهای داخلی (Internal APIs)
Cheque APIs:

createCheque(data) → ثبت چک جدید (وضعیت اولیه: pending)
updateCheque(id, data) → ویرایش چک (فقط در وضعیت pending)
changeChequeStatus(id, newStatus) → تغییر وضعیت + ایجاد/لغو تراکنش + ایجاد/به‌روزرسانی reversalTransactionId
getAllCheques(filters) → لیست با فیلتر (وضعیت، نوع، تاریخ سررسید، حساب)
getChequeById(id) → شامل reversalTransactionId برای بررسی تراکنش معکوس
getPendingCheques → چک‌های در انتظار
getTotalChequesByStatus(status, startDate?, endDate?) → مجموع چک‌ها بر اساس وضعیت
getUpcomingDueCheques(days) → چک‌های نزدیک به سررسید (برای یادآوری)
getPendingPayableChequesByAccount(accountId) → مجموع و لیست چک‌های پرداختی pending یک حساب — ورودی `getAvailableBalance` در Accounts & Banking
**reconcileCheque(chequeId)** → بررسی سازگاری `status`/`accountTransactionId`/`reversalTransactionId` در `chk_cheques` با وضعیت واقعی تراکنش‌های مرتبط در `acc_transactions` — بر اساس ماتریس state machine در `db.md`

```typescript
reconcileCheque(chequeId: UUID): {
 status: 'ok' | 'mismatch'
 chequeStatus: string
 issues: string[] // توضیح هر ناهماهنگی یافت‌شده
}
```

**زمان استفاده**: پس از Migration، پس از Import/Restore، در `reconcileAll`.


روابط با سایر فیچرها

Accounts & Banking: به‌روزرسانی currentBalance هنگام وصول
Currency & Multi-Currency: دریافت نرخ تبدیل لحظه‌ای
Transaction: ایجاد رکورد تراکنش هنگام تغییر وضعیت
Notification & Reminder: یادآوری سررسید چک‌ها
Reports و Dashboard: نمایش چک‌های در جریان و برگشتی


نکات طراحی

وضعیت چک‌ها به صورت state machine مدیریت می‌شود.
تصویر چک به عنوان attachment ذخیره می‌شود.

> **تصمیم قطعی — موجودی رزرو vs. موجودی در دسترس (v1)**:
> برای چک‌های پرداختی، موجودی حساب در زمان صدور **قفل یا کسر نمی‌شود** — `currentBalance` حساب دست‌نخورده می‌ماند تا صف state machine اجرا شود. به‌جای آن، یک تابع محاسباتی فقط‌خواندنی `getAvailableBalance(accountId)` موجودی واقعی منهای تعهدات pending را محاسبه می‌کند:
>
> ```
> getAvailableBalance(accountId) =
> currentBalance
> − Σ (amount of pending پرداختی cheques on this account)
> ```
>
> این مقدار در UI به‌عنوان **هشدار** (نه قید سخت) کنار `currentBalance` نمایش داده می‌شود تا کاربر از تعهدات آتی خود آگاه باشد.
>
> **چرا رزرو واقعی نه؟** رزرو واقعی نیازمند rollback خودکار در صورت `bounced`/`cancelled` است و معماری را پیچیده می‌کند — این برای v2 در نظر گرفته شود.

> **نکته نام‌گذاری**: لینک به `acc_transactions` با نام `accountTransactionId` تعریف شود (یکسان‌سازی با Income و Expense).

## ماشین وضعیت و اثر Ledger

| از → به | تراکنش |
|---------|--------|
| → `pending` (ایجاد) | هیچ |
| `pending` → `cleared` | INSERT `acc_transactions` (`deposit-cheque` یا `withdrawal-cheque`) + journal + لینک `accountTransactionId` |
| `pending` → `bounced` | هیچ تراکنشی |
| `pending` → `cancelled` | هیچ تراکنشی |
| `cleared` → `bounced` | void تراکنش clear + INSERT reversal؛ `reversalTransactionId` پر شود |
| سایر انتقال‌ها | در v1 ممنوع مگر مستندسازی صریح |

`changeChequeStatus` همیشه Atomic + persist. ویرایش فیلدهای مالی فقط در `pending`.

## پیاده‌سازی
- `operationId` روی تراکنش‌های ساخته‌شده از چک
- `reconcileCheque` طبق ماتریس `core/db/db.md`
- یادآوری سررسید از Notification با `relatedFeature='cheque'`

---

## availableBalance — soft constraint

```text
availableBalance = currentBalance − Σ pending payable cheques
```
**Constraint سخت `availableBalance >= 0` در v1 اعمال نمی‌شود** (عمدی).  
کاربر می‌تواند تعهد pending > موجودی ثبت کند → UI **هشدار** + گزارش «تعهدات بدون پوشش».

### Transition matrix (فقط این‌ها مجاز)

| from \ to | pending | cleared | bounced | cancelled |
|-----------|---------|---------|---------|-----------|
| (new) | ✓ | — | — | — |
| pending | — | ✓ | ✓ | ✓ |
| cleared | — | — | ✓ | — |
| bounced | — | **✗** | — | — |
| cancelled | — | — | — | — |

`bounced → cleared` و `cancelled → *` **ممنوع** (Domain reject).  
Enforce در `changeChequeStatus` + تست fixture.

---

## State Machine رسمی

```text
pending → cleared | bounced | cancelled
cleared → bounced   (در صورت برگشت پس از وصول — اگر policy اجازه دهد)
سایر transitionها ممنوع
```

Reconcile state matrix همین را enforce می‌کند. Feature پیچیده لازم نیست.


---

## استقلال Domain چک (P0)

چک به Loan یا Accounting UI **گره خورده نیست**.

چک می‌تواند در خدمت این‌ها باشد:

- Income
- Expense
- Loan
- Purchase / Sale
- Guarantee

Cheque = **Domain مستقل** با Ledger خودش؛ Integration فقط از طریق:

- Feature API / Operation
- CashSettlementPort هنگام وصول
- Accounting Core (journal)

نه import مستقیم جداول Loan.

---

## مدل چک ایران (گسترش)

| فیلد | نقش |
|------|-----|
| `chequeType` | صیاد / بانکی / … |
| `sayadId` | شناسه ۱۶ رقمی (nullable برای چک قدیمی) |
| `bankBranchCode` | |
| `isIsf` / ضمانت | در صورت نیاز |
| `endorsedTo` / Party | خرج‌کردن چک |

وضعیت‌ها (نمونه): `draft` · `issued` · `in_vault` · `transferred` · `cashed` · `bounced` · `blocked`

سررسید: `dueDate` در UTC/ISO؛ نمایش جلالی فقط UI.  
وصول/برگشت → Financial Operation + SettlementPort (نه تغییر موازی بدون operationId).

---

## قفل حسابداری چک (رفع ابهام void)

پس از `cleared`، برگشت = **Reversal Financial Operation** (مبلغ معکوس + لینک به op/tx اصلی).

- ترجیح: journal/cash lines جدید معکوس؛ وضعیت op اصلی `reversed`
- اگر پیاده‌سازی از `isVoided` روی ردیف cash استفاده می‌کند: باید معادل اقتصادی reverse کامل باشد و در گزارش‌ها exclude شود — **نه** پاک کردن یا ویرایش amount
- چک pending که مستقیم bounce می‌شود: بدون cash op

هم‌تراز `Canonical-Financial-Operation` و INV-004.
