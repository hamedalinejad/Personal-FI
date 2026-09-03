# Think-tank resolution log — P0-FIX-001…005

## Members (session)

Systems · Double-entry accountant · Crypto engineer · Domain architect · Data-risk · Product clarity

## Consensus

| Fix | Decision |
|-----|----------|
| 001 | LocalSettlementAdapter resolves **fin_accounts** only; journal is sole cash SoT |
| 002 | acc_transactions = event/projection; never sum with journal for one pocket |
| 003 | rebuild keys: holdingId or exchangeId+instrumentId(+networkId) |
| 004 | Single feePresence truth table; persist gross/fee/net always |
| 005 | economicFeeRole required before cost mutation |

Commit applies these doc locks. Control test for 001 documented in Cash-Settlement-Adapter.md.
