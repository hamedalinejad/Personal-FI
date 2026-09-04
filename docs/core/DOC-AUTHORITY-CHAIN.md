# Documentation Authority Chain

## پنج خانهٔ قانون (Sole rule homes)

پس از حذف فایل‌های `P0-FINAL-*` از `main`، **تنها** این پنج سند برای قوانین زیر مرجع‌اند.  
قانون خارج از این‌ها (و feature docهای تابع) برای implementation **معتبر نیست** مگر به یکی از این‌ها پیوند صریح داشته باشد.

| # | فایل مرجع | دامنه قانون |
|---|-----------|-------------|
| 1 | **`Canonical-Cash-Model.md`** (+ `Cash-Settlement-Adapter.md` به‌عنوان قرارداد Port) | نقد، حساب نقدی، journal balance، ممنوعیت SoT دوم |
| 2 | **`Cost-Basis-Engine.md`** (+ `Fee-Treatment-Matrix.md`) | Cost basis، کارمزد، C2C، transfer/bridge، نقش اقتصادی fee |
| 3 | **`Instrument-Identity.md`** | `instrumentId`، symbol/label، assetKey index |
| 4 | **`Financial-Invariants.md`** | تغییرناپذیرهای مالی، money/decimal اشاره، immutability، absorbed P0 notice |
| 5 | **`Feature-Independence-Contract.md`** (+ **`License-Gate.md`**) | Standalone، Hidden Journal=Core journal، لایسنس/capability |

### لایهٔ بالاتر (constitution / gates)

- `ARCHITECTURE-LOCKED.md` — pipeline و ترتیب اجرا  
- `CODING-GATE.md` / `GO-NO-GO.md` — پذیرش قبل از کد  
- `CANONICAL-FINANCIAL-REQUIREMENTS.md` — فهرست الزامات  
- `Canonical-Financial-Operation.md` — operation/idempotency/durability  

این‌ها **متناقض** با پنج خانهٔ بالا نباید باشند؛ در تعارض، خانهٔ موضوعی + ARCHITECTURE-LOCKED بر UX prose مقدم‌اند.

### ترتیب حل تعارض

```text
1. Five rule homes (table above)
2. Canonical-Financial-Operation / ARCHITECTURE-LOCKED
3. Main Feature doc (must not invent parallel cash/identity/cost rules)
4. Product / UX prose (Pages-IA for navigation only)
```

Feature `*-LOCKS.md` اگر باقی مانده‌اند، باید تابع خانه‌های بالا باشند یا LEGACY.

**ممنوع:** بازسازی فایل‌های `P0-FINAL-*-LOCKS.md` به‌عنوان authority موازی.
