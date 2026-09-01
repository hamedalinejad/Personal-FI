# Persistence State Machine (P0)

sql.js در RAM است؛ persistence به IndexedDB باید **متمرکز** باشد.

## States

```text
CLEAN → DIRTY → PERSISTING → PERSISTED
                      ↓
                   FAILED → RECOVERING → CLEAN | FAILED
```

| State | معنی |
|-------|------|
| CLEAN | RAM ↔ storage هم‌خوان |
| DIRTY | پس از COMMIT sql موفق؛ هنوز swap IndexedDB نشده |
| PERSISTING | write-to-temp-then-swap در جریان |
| PERSISTED | swap موفق |
| FAILED | persist شکست |
| RECOVERING | بازیابی از backup/temp |

## قوانین

1. **فقط Storage Layer** state machine را مدیریت می‌کند — هیچ Featureای persistence logic ندارد.
2. UI «ثبت شد» فقط بعد از مسیر مالی موفق: **SQL COMMIT + persist به PERSISTED** (یا policy صریح documented برای edge case).
3. `beforeunload` / `visibilitychange` فقط best-effort flush هستند.
4. integrity_check قبل از قبول restore.

مرجع: `Technical-Architecture.md` · `db/02-storage-persistence.md`
