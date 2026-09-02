# Cross-Cutting Contracts Batch (Entity / API / Identity / Price)

این سند قفل‌های مشترک برای همه Featureها است. در تعارض با prose قدیمی Feature، **این سند + ماتریس‌های Core** برنده است.

---

## 1. Date semantics on every entity (mandatory fields where applicable)

هر entity مالی / دامنه باید برای فیلدهای زمانی **معنی مشخص** داشته باشد. تقلیل همه به یک `date` ممنوع است.

| Field | Semantics | Typical presence |
|-------|-----------|------------------|
| `createdAt` | زمان نوشتن سیستم (UTC) | always |
| `updatedAt` | آخرین mutation سیستمی | always on mutable rows |
| `eventAt` | زمان رخداد اقتصادی واقعی (اگر شناخته شده) | ops / txs |
| `businessDate` | روز دفاتر / گزارش (DATE، نه timestamp) | financial txs |
| `settlementDate` | تاریخ تسویه نقد/اوراق | trades, some cash |
| `dueDate` | سررسید تعهد | bills, loans, cheques |
| `marketDate` | روز جلسه بازار برای قیمت/معامله | prices, some trades |
| `paymentDate` | تاریخ پرداخت واقعی | loans, bills, tax |
| `fetchedAt` | زمان دریافت از provider (provenance) | prices, FX |
| `priceAsOf` / `rateDate` | as-of ارزش‌گذاری / نرخ | prices, FX |

**قفل:** Feature docs باید برای هر entity بگویند کدام فیلدها اجباری/اختیاری‌اند. مرجع: `Date-Semantics-Matrix.md`.

---

## 2. Shared pagination / filter contract for all public queries

همه `list*` / search public queries:

```text
ListQuery {
  cursor?: string          // preferred
  offset?: number          // optional legacy
  limit: number            // max enforced by Core (e.g. 100)
  sort?: { field: string; direction: 'asc'|'desc' }[]
  filters?: Record<string, unknown>  // feature-defined, documented
  asOf?: string            // when historical
}
ListResult<T> {
  items: T[]
  nextCursor?: string
  totalCount?: number      // optional; expensive
}
```

- Default sort پایدار و مستند.
- Filter fields در Feature API doc لیست می‌شوند؛ فیلتر آزاد SQL ممنوع.
- مرجع: `Feature-API-Contract.md` / `API-Result-and-Errors.md`.

---

## 3. Shared Feature query surface: getById, list, reconcile, rebuild

هر Feature با داده دامنه:

| Method | Required when |
|--------|----------------|
| `getById(id)` | always for primary entities |
| `list(query)` | always (pagination contract §2) |
| `reconcile(id \| scope)` | اگر projection/snapshot دارد |
| `rebuild(id \| scope)` | اگر projection/snapshot دارد |

- `reconcile`: مقایسه snapshot با ledger → report match/mismatch؛ mutate خاموش ممنوع.
- `rebuild`: بازسازی projection از SoT؛ atomic؛ ترجیحاً پس از تأیید کاربر برای repairهای مخرب.
- مرجع: `Reconciliation-Foundation.md`, `Feature-API-Contract.md`.

---

## 4. Deletion / archive / cancel — one matrix

رفتار حذف برای همه entityها فقط از `Deletion-Policy-Matrix.md`:

| Concept | معنی |
|---------|------|
| Hard delete | پاک فیزیکی — فقط برای entityهای غیرمالی / unused طبق ماتریس |
| Soft delete / archive | وضعیت archived؛ داده می‌ماند |
| Cancel | قبل از effect مالی کامل (مثلاً قبل از disbursement) |
| Void / Reverse | بعد از post مالی — از Core reverse |

Feature نباید سیاست حذف مستقل invent کند.

---

## 5. Attachments → Document Management only

- Domain tables **مالک storage path نیستند**.
- به‌جای `attachmentPath` / `filePath` روی domain:
  - `documentId` یا ردیف در `docs_links` (feature, entityType, entityId, documentId).
- Storage، encryption، path در Document Management.
- Migration: pathهای قدیمی → document record + link.

---

## 6. Categories — central registry only

- `category` به‌صورت string آزاد در domain **ممنوع** برای مقادیر کنترل‌شده.
- Registry مرکزی (مثلاً `ref_categories` یا `common_categories`) با:
  - `id`, `code`, `name`, `domain` (expense/income/goal/…), `parentId?`, `active`
- Domain فقط `categoryId` (UUID FK) یا `categoryCode` stabil از registry.
- User-defined categories هم از طریق registry (flag custom) نه متن خام به‌عنوان SoT.

---

## 7. Party identity — `ref_parties`

- هویت شخص/طرف حساب: فقط `ref_parties.id`.
- فیلدهای `payee` / `payer` / `counterpartyName` روی tx = **display snapshot** در لحظه ثبت (قابل تغییر بودن نام party را تحمل می‌کند).
- گزارش‌های تحلیلی party-based از `partyId` استفاده می‌کنند نه متن آزاد.
- ایجاد party اختیاری است (standalone) ولی وقتی identity لازم است → FK به `ref_parties`.

---

## 8. External IDs — namespaced

یک `externalId` جهانی کافی نیست.

```text
ExternalRef {
  sourceKind: 'api' | 'import' | 'manual' | ...
  providerId | adapterKey   // who
  namespace?                // account/tenant/exchange region if needed
  externalId                // id within that provider+namespace
}
```

- Unique logical key ≈ `(sourceKind, providerId, namespace?, externalId)`.
- Import idempotency و price mapping از همین مدل استفاده می‌کنند.

---

## 9. Price mappings can be invalid / expired

هر price mapping (symbol → provider symbol، instrument → feed):

| Field | Role |
|-------|------|
| `status` | `active` \| `invalid` \| `expired` \| `disabled` |
| `validFrom` / `validTo` | optional window |
| `invalidatedAt` / `reason` | audit |

- Mapping منقضی یا invalid در fetch جدید استفاده نمی‌شود؛ fallback مستند (manual / last valid / error).
- UI باید mapping شکسته را نشان دهد.

---

## 10. Price history quote type

هر ردیف `price_history` (و equivalent):

```text
quoteType: 'last' | 'close' | 'nav' | 'indicative' | 'manual' | 'mid' | 'other'
```

- همراه با `priceAsOf` / `marketDate`, `sourceKind`, `fetchedAt` (provenance).
- Valuation باید quoteType مناسب asset را انتخاب کند (مثلاً Fund → `nav`؛ سهم → `close`/`last`).
- هم‌راستا با P0-027 / Price-Fetching locks.

---

## Implementation checklist for Feature authors

1. Entity date fields named per §1  
2. list* uses shared ListQuery/ListResult  
3. getById + list; reconcile/rebuild if snapshots  
4. Deletion only via matrix  
5. No attachmentPath on domain — docs_links  
6. categoryId from registry  
7. partyId → ref_parties; name snapshot only  
8. ExternalRef namespaced  
9. Price mapping status lifecycle  
10. price_history.quoteType required  

