# Database Layers (P0)

Schema ذهنی پروژه در چهار طبقه:

```text
01 CORE
    operations · journal · accounts (fin) · parties · currency · audit

02 DOMAIN LEDGERS
    loans · crypto · stocks · funds · metals · physical assets
    (+ income/expense/cheque/acc cash when enabled)

03 PROJECTIONS
    holdings · balances · portfolio snapshots · dashboard cache

04 SUPPORT
    documents · settings · categories · notifications · prices
```

## قانون مالکیت

| لایه | نقش | SoT؟ |
|------|-----|------|
| **01 + 02** | Canonical Financial Data | **بله** |
| **03** | Rebuildable cache / projection | خیر — از 01+02 rebuild |
| **04** | Supporting | جدا؛ قیمت secondary |

```text
01 + 02 = Canonical Financial Data
03 = Rebuildable
04 = Supporting Data
```

**ممنوع:**
- حقیقت مالی فقط در 03 بدون قابلیت rebuild از 02
- نوشتن مستقیم UI به 01/02 بدون Feature API + atomic operation

مرجع: `Source-of-Truth-Matrix.md` · `Raw-vs-Derived-Data.md` · `db/01-schema-tables.md`

## Seeds & uniqueness (CROSS-CUTTING BATCH-5 §9–§10)

Reference tables have versioned, idempotent seed/migration contracts.  
Uniqueness on nullable business identifiers uses **partial unique indexes** (WHERE col IS NOT NULL) as documented per table.

