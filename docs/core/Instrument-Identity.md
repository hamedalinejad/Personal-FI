# Global Instrument Identity

**تنها SoT هویت دارایی:** `ref_instruments`

```text
ref_instruments
      ├── inv_crypto_instrument_meta (chain, contract, decimals, …)
      ├── stock metadata (isin, firmCode, lotSize, …)
      ├── fif metadata
      └── metal metadata (type, purity)
```

| | |
|--|--|
| Holding / price_history / CA | فقط `instrumentId` → `ref_instruments.id` |
| `symbol` / `assetKey` display | label یا key مشتق — نه registry دوم |
| `inv_crypto_assets` موازی | **ممنوع** |

Crypto/Stocks/FIF/Metals فقط attributes تخصصی اضافه می‌کنند.

| Term | معنی |
|------|------|
| instrumentId | **تنها identity** |
| assetKey | convenience key کریپتو — نه identity دوم |
| displaySymbol / symbol | label |
| providerSymbol | mapping provider |
| providerInstrumentId | id سمت provider |

**ممنوع:** دو SoT هویت (`ref_instruments` + `inv_crypto_assets` موازی).
