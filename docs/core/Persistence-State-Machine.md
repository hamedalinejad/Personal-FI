# Persistence State Machine (P0)

sql.js در RAM است؛ persistence به IndexedDB باید **متمرکز** باشد.

## States (بسط‌یافته)

```text
CLEAN → DIRTY → PERSISTING → PERSISTED → (idle)
                      ↓
                   FAILED → RECOVERING → CLEAN | FAILED

PERSISTED → RECONCILING → CLEAN | FAILED   # در startup / پس از recover
```

| State | معنی |
|-------|------|
| CLEAN | RAM ↔ storage هم‌خوان |
| DIRTY | پس از COMMIT sql موفق؛ هنوز swap IndexedDB نشده |
| PERSISTING | write-to-temp-then-swap در جریان |
| PERSISTED | swap موفق |
| RECONCILING | مقایسه journal/ledger با snapshot پس از load |
| FAILED | persist یا reconcile شکست |
| RECOVERING | بازیابی از backup/temp/WAL |

## WAL قبل از Atomic (الزامی)

قبل از شروع `runAtomicFinancialOperation` (یا بلافاصله پس از validate و قبل از writes سنگین):

1. نوشتن **intent/WAL** سبک در `localStorage` (یا store معادل): `operationId`, commandHash, phase, timestamp
2. اجرای atomic در sql.js (RAM)
3. COMMIT sql
4. state = DIRTY → PERSISTING → IndexedDB swap
5. موفقیت → PERSISTED؛ پاک کردن WAL
6. اگر بین snapshot و persist قطع شود: در **لود بعدی** اپ، WAL + RECONCILING اجباری

```text
reconcileOnLoad():
  - اگر WAL باقی مانده → recover / mark FAILED / user prompt
  - مقایسه fin_journal_entries (و domain ledgers) با snapshots
  - drift → ref_integrity_queue ؛ silent fix ممنوع
```

این در `db.md` ذکر شده بود؛ **پیاده‌سازی در P0 کد الزامی است** نه اختیاری.

## قوانین UI

1. فقط Storage Layer state machine را مدیریت می‌کند
2. UI «ثبت شد» فقط وقتی state = **PERSISTED** (نه فقط SQL COMMIT در RAM)
3. `beforeunload` فقط best-effort
4. integrity_check قبل از restore

مرجع: `Technical-Architecture.md` · `db/02-storage-persistence.md` · `db/04-reconciliation-integrity.md`

## Atomic ops & dual-store recovery (CROSS-CUTTING BATCH-4 §9–§10)

- Financial operation commit is atomic across domain + journal + cash (or explicit recovery-aware 2-phase).
- If primary (SQLite) and secondary (e.g. IndexedDB) layers both exist: write intent → primary commit → secondary persist → mark fully durable. Startup reconciles pending intents. UI success only after defined durable state.

