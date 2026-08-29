# Iran Market Rules (لایه مستقل)

قوانین بازار ایران **جدا از** ledger عمومی سهام نگهداری می‌شوند؛ Stocks adapter از این لایه می‌خواند.

## هویت
- **`instrumentId`** = هویت دارایی (نه symbol)
- `isin`, `firmCode`, `symbol` (نمایش؛ قابل تغییر با CA)

## Microstructure
- `lotSize`, `priceTick`, price limits
- `marketSession`, calendar (پنجشنبه/جمعه + تعطیلات)
- `settlementDate` T+n کاری جدا از `businessDate`

## Corporate Actions (immutable events)
bonus · split · reverse_split · capital_increase · rights · cash_dividend ·  
symbol_change · isin_change · merger · spin-off · delisting · settlement_adjustment

اعمال از طریق `Corporate-Action-Engine` + `operationId`؛ rebuild از ledger همه typeها را می‌شناسد.

جزئیات فیلدها: `Investment-Stocks-Iran.md` · CA engine: `docs/core/Corporate-Action-Engine.md`
