# Storage Abstraction

**ریسک فنی اصلی v1 Web:** sql.js کل DB در RAM + serialize کامل به IndexedDB.

Domain / Application / Feature API **نباید** بدانند storage چیست.

```text
Feature API → Application → Domain → FinancialRepository (interface)
                                      ├── Web/PWA: sql.js + IndexedDB
                                      ├── Desktop (e.g. Tauri): native SQLite file
                                      └── Future: Server/Cloud adapter
```

| پلتفرم | Adapter |
|--------|---------|
| PWA | WASM SQLite + IDB (با state machine فعلی) |
| Desktop | فایل SQLite محلی — Backup/Restore/مالکیت ساده‌تر |
| Cloud | بعداً |

**Core = storage-agnostic.** PWA حذف نمی‌شود؛ Desktop adapter هم‌تراز در معماری.

جزئیات persist Web: `db/02-storage-persistence.md` · `db/06-migration-backup-audit.md`
