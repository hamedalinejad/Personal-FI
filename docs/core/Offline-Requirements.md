# الزامات Offline (P0)

سیستم بدون اینترنت **کاملاً قابل استفاده** است.

| # | قاعده |
|---|--------|
| 1 | دیتابیس محلی (sql.js → IndexedDB) |
| 2 | عملیات اصلی وابسته به API خارجی نیست |
| 3 | قیمت: دستی، CSV، فایل محلی |
| 4 | API آنلاین فقط از طریق **Adapter** اختیاری |
| 5 | قطع اینترنت مانع ثبت تراکنش نمی‌شود |
| 6 | داده‌های opt-in آنلاین در صف محلی (اگر sync آینده) |
| 7 | Backup دستی و (در صورت فعال) خودکار |
| 8 | Export: JSON، CSV، فرمت داخلی `.personalfi` |
| 9 | Restore روی سیستم جدید **آزمایش‌شده** |
| 10 | پیوست‌ها همراه Backup |
| 11 | DB و Backup قابل رمزنگاری |
| 12 | اطلاعات حساس در Log نوشته نشوند |
| 13 | License با توکن امضاشده محلی — نه اعتبارسنجی دائمی سرور |
| 14 | خاموشی ناگهانی → نیمه‌ثبت نشود (atomic + persist PERSISTED + WAL) |

## قیمت در Offline

Offline ≠ ساختن قیمت لحظه‌ای از هیچ.

قیمت نمایشی همیشه با:

- تاریخ / asOf / marketDate
- منبع (manual, csv, api, …)
- زمان آخرین به‌روزرسانی + stale در صورت نیاز

مرجع: Technical-Architecture · Persistence-State-Machine · Price-Fetching · License-Offline

## Optimistic UI (CROSS-CUTTING BATCH-4 §7)

Optimistic financial UI must show pending state and confirm only after durable persist ACK; on failure, UI rolls back. Final financial values before persist are forbidden.

## Rebuild offline (X-013)

Valuation/rebuild use local last-known or manual prices with stale flags. Airplane mode must allow transaction + rebuild.

## Final Audit §22 — Offline acceptance proofs

1. airplane mode: ordinary financial writes
2. airplane mode: rebuild + reports from local data
3. missing online prices → STALE/MISSING_INPUT, never invented zero
4. crash mid-persist → no half-posted operation
5. recovery preserves history
6. backup restore on clean machine
7. attachments survive backup/restore
8. license expiry does not wipe financial history
9. export works when feature license-disabled

---

## Crash Recovery (atomic financial ops)

### Problem

Complex ops (e.g. stock buy + fees + T+2 settlement intent) must not leave a half-written domain+journal state after process kill.

### Rules

1. **Single SQLite transaction** wraps: domain rows + journal header/lines + operation row (`status` transitions to `posted` only on successful COMMIT).
2. **Durability after COMMIT:** `db_meta.durabilityState = sql_committed` → IndexedDB/persist swap → `persisted` | `persist_failed`.
3. UI «ثبت شد» only when **persisted** (or product-defined durable policy), never on RAM-only commit alone.
4. On restart: if `sql_committed` but not `persisted`, **retry persist** — do not re-run the financial command (idempotent `operationId`).
5. If SQL never committed: no domain/journal residue (rollback).
6. Multi-leg ops (C2C, reinvest, buy+fee) share **one `operationId`** so partial legs cannot exist without the whole plan.

### Acceptance scenarios

| Scenario | Expected |
|----------|----------|
| Kill during validate | no rows |
| Kill after SQL COMMIT before IDB | retry persist; one operation |
| Kill mid-plan before COMMIT | rollback; user retries same or new operationId per policy |
| Complex stock buy T+2 | trade + payable/fee legs atomic with operation |

See also: `Canonical-Financial-Operation.md`, `Multi-Tab-Writer-Contract.md`.

## BUG-D05 — Fallback valuation when offline / price missing

Sale and mark paths **must not block** solely because live Price Fetching failed.

```text
PriceSelectionPolicy (aligned P0-FINAL-007):
  1. Use trade price from command if user/import supplied
  2. Else LAST_KNOWN_BEFORE_ASOF from price_history
  3. Else MANUAL only
  4. Never invent 0 as market price

On Last_Known_Price use:
  valuationSource = "last_known"
  reconciliationNeeded = true   // flag on position/snapshot/operation metadata
  stale = true if age > staleMaxAge

When back online:
  price sync may refresh marks; reconciliation queue processes reconciliationNeeded
  historical posted trade prices remain immutable
```

PnL for a sell uses **command trade price** (or last known if policy allows mark). Missing live feed ≠ skip PnL.
