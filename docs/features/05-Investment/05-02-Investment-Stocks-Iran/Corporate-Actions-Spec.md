# Corporate Actions — اثر روی Quantity / Cost / P&L (v1)

Identity: `instrumentId`. symbol change ≠ holding جدید.

| Action | v1 | Quantity | Cost Basis / Avg | Realized P&L | Cash |
|--------|-----|----------|------------------|--------------|------|
| Dividend (cash) | Yes | unchanged | unchanged | no (income) | + cash |
| Bonus shares | Yes | ↑ ratio | cost total same → avg ↓ | no | none |
| Stock split | Yes | ↑ ratio | cost total same → avg ↓ | no | none |
| Reverse split | Yes | ↓ | cost total same → avg ↑ | no | none |
| Capital increase (cash rights) | partial | per rights rules | + cash paid into basis | no until sale | − cash if paid |
| Rights issue / exercise / sell | Yes | per rules | allocated | rights sell may realize | vary |
| Symbol / ISIN change | Yes | same | same | no | no |
| Merger / Spin-off | v1.1+ | mapping | allocated | policy | vary |

همه از `Corporate-Action-Engine` + `operationId`. Rebuild ledger همه typeهای پشتیبانی‌شده را می‌شناسد.

Fields: TradeDate, SettlementDate, MarketDate, Session, Broker, ISIN, FirmCode, Lot, Tick, Fees breakdown — در Iran-Market-Rules + Stocks doc.

**Immutable:** CA تراکنش‌های قبلی را **rewrite نمی‌کند**. History ثابت + CA event + holding state جدید.
