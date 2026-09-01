# Crypto v1 Scope (قفل پیچیدگی)

## Production-grade در v1

- Spot Buy / Spot Sell
- Crypto-to-Crypto (swap)
- Deposit / Withdrawal
- Internal Transfer (cost basis preserved)
- Fees (trade / network / transfer جدا)
- Airdrop / Free Receipt
- Opening Balance

## Unsupported در v1 (future module — ناقص طراحی نشود)

Futures · Perpetual · Margin · Borrowing · Staking · Lending · Liquidity Pools · DeFi · Bridging · Wrapped Assets · NFT · Options

اگر بعداً Staking اضافه شود باید جداگانه: reward income, accrual, claim, restake, cost basis, tax basis.

## Transfer (P0)

```text
BTC Exchange A → Wallet B
```

**تضمین:**

- quantity moves
- cost basis preserved
- acquisition date preserved
- lot identity preserved
- economic ownership **unchanged**
- فقط location تغییر می‌کند

**ممنوع:** acquisitionCost = 0 روی transfer داخلی.

## Fee سه مفهوم

`TradeFee` · `NetworkFee` · `TransferFee` — accounting جدا.

## Network identity

USDT-TRC20 / ERC20 / TON = instruments جدا:

`asset` · `network` · `contractAddress` · `chainId` · `decimals`
