# 04 reconciliation integrity

## قرارداد Reconciliation مرکزی

Snapshotها (موجودی حساب، units، quantityMg، cashBalance، …) ممکن است به‌خاطر خطای Domain از Ledger فاصله بگیرند. یک مکانیزم **مرکزی فقط‌خواندنی** برای تشخیص ناهماهنگی الزامی است.

### APIهای مشترک (لایه Domain / `core` یا `db/reconciliation.ts`)

| API | مقایسه |
|-----|--------|
| `reconcileAccount(accountId)` | `acc_accounts.currentBalance` ↔ Σ اثر `acc_transactions` غیرvoid روی همان حساب (با ترتیب تاریخ + `balanceAfterTransaction` در صورت وجود) |
| `reconcileCryptoHolding(holdingId)` | `quantity` / `totalInvested` ↔ Σ `inv_crypto_transactions` |
| `reconcileBrokerage(brokerageId)` | `cashBalance` ↔ Σ تراکنش‌های نقدی کارگزاری + لینک‌های `acc_transactions` |
| `reconcileStockHolding(holdingId)` | `quantity` / `totalInvested` / `averageBuyPrice` ↔ Σ `inv_stocks_iran_transactions` (buy/sell) — محاسبه با Weighted Average از صفر |
| `reconcileFund(holdingId)` | `units` / `totalInvested` ↔ Σ `inv_fif_transactions` (buy/sell/reinvest) |
| `reconcileMetalsHolding(holdingId)` | `quantityMg` / `totalInvested` ↔ Σ `inv_metals_transactions` |
| `reconcileMetalsPlatformCash(platformId)` | `inv_metals_platforms.cashBalance` ↔ Σ دو منبع: (۱) `inv_metals_platform_transactions` (deposit اضافه، withdraw کم) + (۲) `inv_metals_transactions` (buy کم، sell اضافه، deliveryFee کم) |
| `reconcileLoan(loanId)` | مانده وام ↔ جدول اقساط / `ln_transactions` |
| `reconcileCheque(chequeId)` | سازگاری `status` / `accountTransactionId` / `reversalTransactionId` در `chk_cheques` ↔ وجود/جهت/وضعیت تراکنش‌های مرتبط در `acc_transactions` — بر اساس ماتریس state machine (جدول زیر) |
| `reconcilePortfolio` | جمع ارزش‌ها و اسنپ‌شات‌های کلیدی در برابر مجموع reconciles جزئی |
| `reconcileAll` | اجرای همه موارد بالا (شامل `reconcileStockHolding` برای همه Holdingها، `reconcileCheque` برای همه چک‌های غیر-cancelled، و `reconcileMetalsPlatformCash` برای همه پلتفرم‌های فلزات)؛ خروجی گزارش یکپارچه |

**ماتریس انتظار `reconcileCheque` — یک چک سالم باید:**

| status | accountTransactionId | reversalTransactionId |
|--------|---------------------|----------------------|
| `pending` | `null` | `null` |
| `cleared` | UUID معتبر + `isVoided=false` در `acc_transactions` | `null` |
| `bounced` (مستقیم از pending) | `null` | `null` |
| `bounced` (از cleared) | UUID معتبر + `isVoided=true` در `acc_transactions` | UUID معتبر + `isVoided=false` در `acc_transactions` |
| `cancelled` | `null` | `null` |

هر انحراف از این ماتریس به‌عنوان Mismatch گزارش می‌شود.

### خروجی استاندارد هر reconcile

```typescript
interface ReconcileResult {
 target: string; // e.g. 'account:uuid'
 ok: boolean;
 expected: string; // decimal string از ledger
 actual: string; // decimal string از snapshot
 delta: string; // actual - expected
 details?: string;
}
```

### قوانین
1. Reconciliation **هرگز خودکار snapshot را عوض نمی‌کند** مگر با عملیات صریح Repair (نسخه ۱: فقط گزارش؛ Repair = Should Have با تأیید کاربر).
2. بعد از هر `runAtomicFinancialOperation` موفق، فراخوانی reconcile همان aggregate در dev/test توصیه‌شده است.
3. Dashboard/Settings می‌تواند «سلامت داده» را از `reconcileAll` نشان دهد (اختیاری v1).
4. معیار مقایسه همیشه decimal.js؛ آستانه صفر مطلق برای پول (یا epsilon بسیار کوچک فقط برای نرخ‌های اعشاری اگر مستند شود).

---

## مکانیزم واقعی Reconciliation

APIهای `reconcile*` / `rebuild*` فقط مشخصات نیستند؛ در implementation باید **قابل اثبات** کنند `snapshot == ledger`.

### قرارداد اجرایی
1. **ماژول** `core/reconciliation/` (یا `db/reconciliation.ts`):
 - `reconcileX(id): Promise<ReconcileResult>`
 - `rebuildXFromLedger(id): Promise<void>` فقط پس از تأیید کاربر
2. **الگوریتم مشترک**:
```text
expected = pure function over non-voided ledger rows (decimal.js)
actual = current snapshot column(s)
delta = actual - expected
ok = delta.isZero
```
3. **اثبات در تست**: unit/integration با fixture — بعد از atomic op، `reconcileX` → `ok:true`؛ بعد از فساد عمدی snapshot → `ok:false` و rebuild جبران می‌کند.
4. **Runtime**:
 - Dev/Test: بعد از هر `runAtomicFinancialOperation` روی aggregate همان op
 - Production v1: `reconcileAll` از Settings «سلامت داده» + قبل از Backup + بعد از Restore
5. **خروجی پایدار** در جدول اختیاری `fin_reconcile_runs` (Should Have): `{ ranAt, scope, ok, deltaSummary }` برای audit.
6. تا وقتی کد و تست fixture وجود ندارد، checklist پیاده‌سازی این قابلیت **باز** است — مستند به‌تنهایی «اجرایی‌شده در runtime» نیست.

### منبع حقیقت مقایسه
- همیشه **ledger rows** (و در صورت نیاز `fin_journal_entries` برای cross-feature)
- هرگز `balanceAfterTransaction` یا سایر snapshotها به‌عنوان expected

---

## Integrity Pipeline (Must Have)

```text
detect (reconcile / FK validate / orphan scan)
  → quarantine (flag entity: integrityStatus=suspect؛ جلوگیری از archive/delete خام)
  → reconcile (گزارش expected/actual/delta)
  → repair (صریح کاربر؛ transactional)
  → audit (fin_audit_log)
```

`ref_integrity_queue` ردیف‌ها: `{ id, entityType, entityId, issueCode, detectedAt, status: open|quarantined|repaired|dismissed, operationId? }`.

Archive والد فقط اگر صف open برای children خالی باشد یا RESTRICT.

---

## Reconciliation Engine مرکزی

ماژول `core/reconciliation/` — فیچرها فقط adapter می‌نویسند، نه engine جدا.

```typescript
interface ReconcileContext {
  scope: ReconcileScope;
  targetId: string;
  operationId?: string;
}

interface ReconcileResult {
  target: string;
  ok: boolean;
  expected: string; // decimal or structured JSON string
  actual: string;
  delta: string;
  source: 'domain_ledger' | 'cash_ledger' | 'journal' | 'mixed';
  repairStrategy: 'none' | 'rebuild_snapshot_from_ledger' | 'manual';
  severity: 'info' | 'warning' | 'critical';
  details?: string;
  calculationVersion?: string;
}

interface ReconcileAdapter {
  scope: ReconcileScope;
  computeExpected(id: string): Promise<string>;
  readActual(id: string): Promise<string>;
  repair?(id: string, ctx: ReconcileContext): Promise<void>; // فقط از engine
}
```

`reconcileAll` = اجرای همه adapterهای ثبت‌شده.

### Repair Transactional + Audited
```text
BEGIN
  validate target + pre-reconcile snapshot
  rebuild from ledger (Domain SoT)
  post-verify reconcile ok
  INSERT fin_audit_log (action=repair, before/after, calculationVersion)
  clear/update ref_integrity_queue
COMMIT
→ persist
→ سپس post-commit events
```
ممنوع: UPDATE snapshot بدون verify و audit.

---

