# Cross-Cutting Contracts Batch 4 (Snapshots / Rebuild / Import / Offline / API / Atomic / Recovery)

قفل زیرساخت — در تعارض با prose قدیمی، این سند + Offline/persistence contracts برنده است.

---

## 1. Net Worth vs pending cheques

- **Net Worth / `calculateWealthView` default** نباید مبلغ چک‌های pending صادرشده را به‌عنوان liability قطعی داخل `netWealth` اصلی جمع کند مگر:
  - metric **جدا** درخواست شود، مثلاً `committedAdjustedNetWorth` / `netWealthIncludingPendingPayables`.
- Pending cheques = contingent / soft commitment؛ در breakdown اختیاری با label صریح.
- هم‌راستا با تمایز قبلی currentNetWorth vs committedAdjustedNetWorth.

---

## 2. Snapshot watermark / last operation id

هر snapshot مالی (portfolio, account daily, holdings projection, dashboard cache, net-worth snapshot):

```text
sourceWatermark: {
  lastOperationId?: string
  lastBusinessDate?: DATE
  lastJournalSequence?: number | string
  rebuiltAt: ISO datetime
  schemaVersion: string
}
```

- Stale detection: مقایسه watermark با head ledger/operation log.
- Snapshot بدون watermark برای financial truth = incomplete (P0 hygiene).

---

## 3. Rebuild is deterministic and offline

- `rebuild*` / reconcile rebuild path:
  - **فقط** از ledger محلی، operations، domain txs، stored prices/FX as-of.
  - **بدون** network / live provider calls.
- اگر قیمت کم است: last stored / manual / gap flag — نه fetch در حین rebuild.
- همان ورودی → همان خروجی (deterministic given stored SoT + engineVersions).

---

## 4. Import preserves raw source; normalization is additive

```text
import_raw_payloads / blob  → immutable bytes or structured raw
normalized commands         → derived; may be re-run with new mapper version
```

- Normalization **overwrite روی raw نمی‌کند**.
- Re-process از raw با `mapperVersion` جدید مجاز است؛ audit نگه می‌دارد کدام version commit شده.
- ببین Import-Lineage / Import-Infrastructure.

---

## 5. Migration rollback documented per schema version

هر schema migration:

| Field | Required |
|-------|----------|
| `fromVersion` → `toVersion` | yes |
| forward steps | yes |
| **rollback steps** or explicit `rollback: not_supported` + recovery path | yes |
| data preservation notes | yes |

- «migrate up only» بدون سند rollback/recovery برای آن version ممنوع در release notes داخلی.
- ببین Migration-Data-Preservation.md.

---

## 6. Offline single-writer lock on all financial writes

- هر write مالی (operation commit, journal, domain financial tables):
  - باید **writer lock** (Web Locks + lease per Multi-Tab-Writer-Contract) را بگیرد.
- Read-only queries بدون exclusive write lock مجازند.
- نقض single-writer برای sql.js path = data corruption risk → P0.

---

## 7. UI optimistic updates — confirm after durable persist

- Optimistic UI برای موجودی/P&L/هدف مجاز است فقط با:
  1. نمایش pending state، و
  2. **confirm** پس از durable persist success (SQLite/persistence layer ACK)،
  3. rollback UI روی failure / conflict.
- نشان دادن عدد مالی به‌عنوان final قبل از persist = ممنوع.

---

## 8. Canonical API error codes

حداقل مجموعه مشترک (API-Result-and-Errors):

| Code | Use |
|------|-----|
| `VALIDATION_ERROR` | input/domain validation |
| `CONFLICT` | version/state conflict |
| `IDEMPOTENCY_CONFLICT` | same key different payload |
| `INSUFFICIENT_BALANCE` | cash/qty not enough |
| `STALE_DATA` | snapshot/asOf/price stale beyond policy when op requires fresh |
| `NOT_FOUND` | |
| `PERMISSION_DENIED` | |
| `INTERNAL` / `RECOVERY_REQUIRED` | persistence/recovery |

Feature-specific codes extend؛ جایگزین این‌ها برای همان معنی نشوند.

---

## 9. Financial operations atomic across domain + journal + cash

- یک `operationId` commit:
  - domain legs + journal lines + cash settlement effects در **یک تراکنش atomic** persistence (یا explicit 2-phase با recovery).
- Failure میانی → **نباید** half-applied بماند؛ یا full commit یا rollback + recovery state.
- ببین Canonical-Financial-Operation + Persistence-State-Machine.

---

## 10. Crash between SQLite commit and IndexedDB (or secondary) persist

اگر دو لایه persist وجود دارد (مثلاً sql.js memory/SQLite file vs IndexedDB mirror):

```text
Durable recovery protocol:
1. Write-ahead intent / operation log entry (pending)
2. Primary commit (SQLite)
3. Secondary persist (IDB)
4. Mark operation durable_fully
On startup:
- scan pending intents / compare watermarks
- complete secondary OR rollback primary per policy
- never leave user-visible success without durable path
```

- جزئیات در `Persistence-State-Machine.md` / Offline-Requirements.
- UI success فقط پس از رسیدن به state تعریف‌شده «durable» در آن doc.

---

## Checklist

1. Pending cheques not in core Net Worth without separate metric  
2. Snapshots carry source watermark / lastOperationId  
3. Rebuild offline + deterministic  
4. Import raw immutable; normalize derived  
5. Migration rollback documented per version  
6. Single-writer lock all financial writes  
7. Optimistic UI confirmed after durable persist  
8. Canonical error codes  
9. Atomic domain+journal+cash  
10. SQLite↔IDB crash recovery protocol  

