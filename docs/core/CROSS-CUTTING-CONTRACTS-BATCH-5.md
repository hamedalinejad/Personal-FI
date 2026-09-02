# Cross-Cutting Contracts Batch 5 (Audit / Export / Labels / Packages / Ports / Seeds / Indexes)

---

## 1. Audit log fields mandatory

هر ردیف `fin_audit_log` (یا equivalent) حداقل:

| Field | Role |
|-------|------|
| `actor` | user id / system / import job |
| `source` | ui \| api \| import \| migration \| repair \| system |
| `reason` | human or coded reason (nullable only if system-automated with eventKind) |
| `operationId` | when financial; link to fin_operations when applicable |
| `entityType` / `entityId` | target |
| `action` | created \| updated \| reversed \| repaired \| … |
| `at` | timestamp |

بدون actor/source برای mutationهای کاربر = ناقص.

---

## 2. Audit log ≠ financial event

- **Financial event / operation** = SoT اقتصادی (journal, domain, balances).
- **Audit log** = چه کسی/چه سیستمی چه کرد؛ observability.
- یکی کردن جدول یا یکی فرض کردن معنی = ممنوع.
- مرجع: `Audit-vs-Financial-Event.md`.

---

## 3. Report export — stale detect / rebuild before export

قبل از Excel/PDF/CSV export مالی:

1. بررسی watermark / stale روی snapshots استفاده‌شده.
2. اگر stale نسبت به policy: **rebuild** یا fail با `STALE_DATA` (نه export خاموش از cache کهنه).
3. Export metadata: `asOf`, `rebuiltAt`, `watermark`.

---

## 4. Excel/PDF export preserves decimal strings

- مبالغ از API به‌صورت decimal **string** وارد export pipeline می‌شوند.
- **ممنوع:** تبدیل به IEEE float/number قبل از نوشتن سلول/متن.
- Excel: text or precise decimal handling؛ PDF: همان رشته قالب‌بندی‌شده.
- رُند نمایش UI ≠ از دست دادن precision در فایل.

---

## 5. User-facing labels ≠ semantic field rename

- نام فیلد دامنه/API ثابت می‌ماند (`amountInBase`, `businessDate`, …).
- UI label از **mapping dictionary** (i18n / labels doc) می‌آید.
- تغییر label فارسی/انگلیسی حق تغییر semantic name در DB/API را ندارد.
- هر Feature می‌تواند `labels.md` یا کلید i18n داشته باشد؛ mapping مستند است.

---

## 6. Local modules — Capability API without parent UI

- هر ماژول/Feature قابل استفاده از Capability API / Feature API **بدون** mount کردن parent UI است.
- Headless: tests, jobs, import, reports, license-limited modules.
- UI فقط یکی از clientهاست؛ نه پیش‌شرط اجرا.
- مرجع: `Capability-API.md`, `Feature-Independence-Contract.md`.

---

## 7. Feature package boundaries — no circular dependency

```text
Feature A ↛ Feature B domain/repo
Feature A → Core ports / Capability API → (optional) Feature B adapter
```

- Circular import بین feature packages در architecture ممنوع.
- Shared types در Core / `contracts`؛ نه feature-to-feature deep imports.
- مرجع: `Feature-Package-Architecture.md`.

---

## 8. Cross-feature writes only via operation adapter / CashSettlementPort

- Feature A **نباید** repository/table مربوط به Feature B را مستقیم بنویسد.
- مسیر مجاز: Financial Operation + adapter / `CashSettlementPort` / public command API B.
- Direct SQL/repo cross-feature write = architecture violation (P0).

---

## 9. Common reference tables — seed/migration contract

جداول مرجع (`ref_instruments` seeds، categories، currencies، party types، …):

| Requirement | |
|-------------|--|
| Seed data versioned | `seedVersion` / migration step |
| Idempotent seed | re-run safe |
| Documented in migration | which codes are system vs user |
| No silent delete of referenced seed | if in use |

---

## 10. Uniqueness + partial unique indexes for nullable identifiers

جایی که identifier اختیاری است (مثلاً `externalId`, `accountId`, `dedicatedAccountId`):

```sql
-- conceptual
UNIQUE(providerId, namespace, externalId) WHERE externalId IS NOT NULL
```

- UNIQUE سراسری روی ستون nullable که چند NULL را منع کند (بسته به DB) یا برعکس اجازه duplicate business key بدهد = باید با **partial unique index** صریح حل شود.
- هر constraint یکتایی در schema doc مشخص می‌کند partial است یا نه.

---

## Checklist

1. Audit: actor, source, reason, operationId  
2. Audit ≠ financial event  
3. Export preflight stale/rebuild  
4. Export decimal strings no float  
5. Labels mapped; semantic names stable  
6. Capability API runs without parent UI  
7. No circular feature dependencies  
8. Cross-feature writes via ports/ops only  
9. Ref data seed/migration contract  
10. Partial unique indexes for nullable keys  

