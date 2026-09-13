# Module: Crypto

**Owner:** this file

## 1. Purpose
Spot crypto holdings with fee-aware cost basis.

## 2. Scope SUPPORTED
buy · sell · transfer · fee_funding_kind cash|asset · positive qty gates · instrumentId identity (network-aware instruments distinct).

## 3. DEFERRED / OPEN
swap · deposit/withdraw full surface · airdrop · complete reversal suite · DeFi.

## 4. Economic kind
transfer-like ops must declare internal_transfer | bridge | economic_swap | acquisition | disposal as applicable.

## 5. Fees
feeCurrency XOR feeInstrumentId; fee_from_received requires receivedInstrumentId context.

## 6. Cash
No exchange cash ledger SoT — journal only.

## 7. Acceptance
Dimensional fee tests · conservation · standalone crypto-only path partial.


## Economic kinds (locked)
| Kind | Realized P&L | Cost basis |
|------|--------------|------------|
| internal_transfer | no | carry |
| bridge_transfer | no | carry (+ fee policy) |
| economic_swap | yes on source | dest = consideration |
| acquisition | n/a | new cost |
| disposal | yes | release cost |
