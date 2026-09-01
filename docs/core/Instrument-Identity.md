# Global Instrument Identity

**تنها SoT هویت دارایی:** `ref_instruments.id` (`instrumentId`)

```text
                 ref_instruments
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   inv_crypto_*    inv_stocks_*    inv_fif_* / inv_metals_*
   (meta + txs +   (txs + holdings)  (txs + holdings)
    holdings)
```

| جدول / مفهوم | نقش |
|---------------|-----|
| `ref_instruments` | **تنها registry هویت** — یک ردیف = یک دارایی Canonical |
| `inv_crypto_instrument_meta` | attributes زنجیره/قرارداد/decimals — FK به `ref_instruments.id` |
| stock / fif / metal meta | ISIN، fundId، purity، … — FK به همان id |
| Holding / Transaction / price_history / CA | فقط `instrumentId` → `ref_instruments.id` |

## اصطلاحات

| Term | معنی |
|------|------|
| **instrumentId** | **تنها identity** — UUID در `ref_instruments` |
| assetKey | کلید راحتی/ایندکس کریپتو (`chainId:contract` یا `chainId:native:SYMBOL`) — **نه** SoT هویت؛ در `externalRef` یا meta ذخیره می‌شود |
| displaySymbol / symbol | label نمایشی |
| providerSymbol | mapping سمت provider |
| providerInstrumentId | id سمت provider |
| ISIN / ticker / firmCode | attributes سهام — نه identity موازی |
| contractAddress / networkId / chainId | attributes مکان/شبکه — هویت asset از instrument؛ location از holding (exchangeId + networkId) |

## قوانین اجباری

1. **ممنوع:** جدول موازی `inv_crypto_assets` (یا هر registry دوم) به‌عنوان SoT هویت.
2. **ممنوع:** uniqueness و rebuild صرفاً روی `symbol`.
3. همه Featureها:
   - `inv_crypto_transactions.instrumentId`
   - `inv_crypto_holdings.instrumentId`
   - `inv_stocks_iran_transactions.instrumentId` / holdings
   - `inv_fif_transactions.instrumentId` / holdings
   - `inv_metals_transactions.instrumentId` / holdings
4. `assetKey` در صورت نیاز **مشتق** از meta ابزار است و برای ایندکس/قیمت‌یابی کمکی استفاده می‌شود؛ Application logic هویت را از `instrumentId` می‌گیرد.
5. USDT-ERC20 و USDT-TRC20 = **دو** `ref_instruments` جدا (دو instrumentId).
6. موجودی location (کدام صرافی/والت/شبکه) روی **Holding** است (`exchangeId`, `networkId`)، نه روی تعریف instrument.

## Holding uniqueness (منطقی)

```text
UNIQUE(exchangeId, instrumentId)          -- صرافی / موجودی داخلی
UNIQUE(exchangeId, networkId, instrumentId) -- والت on-chain (در صورت نیاز تفکیک شبکه)
```

نه `UNIQUE(..., symbol)` و نه `assetKey` به‌عنوان PK منطقی.

## قیمت‌گیری

```text
price_history.instrumentId = ref_instruments.id
Adapter: instrumentId → providerSymbol / assetKey mapping
هرگز fetch فقط با symbol خام به‌عنوان identity
```

## Migration از طراحی قدیمی assetKey-centric

1. برای هر `(chainId, contractAddress|native, symbol)` یک ردیف `ref_instruments` + meta بساز.
2. `instrumentId` را روی همه txs و holdings بنویس.
3. `assetKey` را به‌عنوان فیلد مشتق/ایندکس نگه دار (Preserve) ولی SoT ندان.
4. rebuild holdings از txs با group by `instrumentId` (+ location).

جزئیات فیلد: `Field-Level-Data-Ownership-Matrix.md`  
Schema: `db/05-constraints-polymorphic.md` · `db/01-schema-tables.md`


---

## Currency ≠ Instrument (P0)

دو مفهوم Domain جدا که نباید قاطی شوند:

| مفهوم | معنی | مثال |
|--------|------|------|
| **Currency** | واحد پول / valuation denomination | IRR, USD, EUR |
| **Instrument** | چیزی که کاربر **مالک** آن است | BTC, ETH, USDT-TRC20, شبندر, طلا ۱۸ عیار, واحد صندوق X |

```text
Currency  = واحد اندازه‌گیری و گزارش
Instrument = دارایی قابل تملک (ref_instruments)
```

- لیست `cur_currencies` می‌تواند کدهایی مثل USDT/BTC برای **نرخ و نمایش** داشته باشد.
- هویت مالکیت و cost basis و holding همیشه از **`instrumentId`** می‌آید.
- Application logic موجودی سرمایه‌گذاری را از Currency table به‌عنوان asset registry نمی‌خواند.

### USDT (تأیید تصمیم فعلی)

USDT ذاتاً همیشه Cash یا همیشه Investment نیست:

| زمینه | نقش |
|--------|------|
| موجودی نقد صرافی (quote cash) | می‌تواند **Cash** باشد (`inv_crypto_cash` / settlement) |
| USDT-TRC20 / USDT-ERC20 به‌عنوان holding | **Instrument / Investment** با instrumentId جدا |

دو شبکه = دو `ref_instruments` جدا. این اصل Core باقی می‌ماند.

---

## P1 Risk: symbol as identity — ممنوع

تغییر نماد بورسی یا rename نمایشی **نباید** تاریخچه holding/tx را بشکند.

```text
SoT identity = instrumentId (ref_instruments)
ISIN = attribute پایدار وقتی موجود است
symbol / ticker = display / search only
```
