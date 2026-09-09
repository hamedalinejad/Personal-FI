# Domain Contracts §31–44 (LOCKED)

**Status:** SPECIFIED for all domains · **Executable:** Loan path first; others implement after Loan vertical RELEASE-PROVEN.  
**Authority:** this file + feature docs under `docs/features/**`. Runtime must not diverge.

## 31 Crypto
- Every command: `operationId`, `instrumentId`, `businessDate`, source/provenance.
- Buy preserves: grossQuantity, feeQuantity, netQuantity, feeRole, costTotal, costCurrency, price, priceAsOf, externalTxId, networkId, exchangeId.
- fee_from_received: `net = gross - fee`.
- Internal transfer: same economics, no realized P&L, cost basis moves.
- C2C: destination cost = economic consideration (+ capitalized fee by policy); never spot mark alone.

## 32 Stocks Iran
- Identity: `ref_instruments.id`; ISIN + brokerage preserved.
- Trade: quantity, price, tradeDate, settlementDate, commission, tax, otherFee, currency, brokerageId.
- T+2: trade event → payable/receivable → settlement → cash. Do not collapse trade/settlement dates.
- CA: Corporate Action engine owns mutation + provenance.

## 33 Funds
- Preserve NAV and transactionPrice independently.
- Subscribe accounting uses transactionPrice; valuation may use NAV.
- Reinvest: distribution income leg + subscription leg in one operation; no fake external cash duplicate.

## 34 Metals
- Fields: grossWeight, unit, purityCode, purityRatio, fineWeight, metalPrice, premium, fee, currency, platform, physicalDelivery.
- `fineWeight = grossWeight × purityRatio` (engine).
- Premium ≠ metal price.
- Physical delivery: platform holding → physical asset; preserve cost + provenance.

## 35 Cheque
- States: draft → issued → deposited → cleared | bounced.
- Preserve: sayadiId, chequeNumber, dueDate, clearedDate, bouncedDate, bouncedReason, operationId.
- Correction = reversal + new operation.

## 36 Cash
- SoT: `fin_accounts` + `fin_journal_lines` only.
- Feature cashBalance is not independent truth.
- `acc_transactions` = projection/event log only.
- Standalone: LocalSettlementAdapter · Full: AccountsCashAdapter.

## 37 Feature Independence
- Editions: loan-only, crypto-only, fund-only, stocks-only, metals-only, full.
- Each runs without Accounts UI; Core always present.
- License may hide features; never erase history.

## 38 FX
- String rates only; as-of filter; source priority; stale; multi-hop deterministic; inverse; ValuationContext; contextHash.
- Missing rate ≠ zero.
- Tie-break: fewest hops → source priority → lexical path.

## 39 Price
- Persistence truth: `price_history`.
- Precedence: manual > cache > online; quoteType, asOf, isStale, provenance.
- Public APIs reject numeric money (no coerce).

## 40 Rebuild Determinism
```
same ledger + engineVersions + ValuationContext + dataset = same report
```
Order: business/effective date → createdAt → stable ID. Snapshots rebuildable.

## 41 Import / Preservation
raw → hash → unknownFields → normalize → map → override? → operation.  
Never discard: unknownFields, sourceProvider, sourceReference, sourceDocumentId, providerTxId, batchId, rawRecordHash.

## 42 Iran Money
- Book currency: **IRR only**.
- Display/input: 1 Toman = 10 IRR (`src/core/iran/toman.js`).
- Normalize to IRR before journal.

## 43 Dates
- Storage: Gregorian `YYYY-MM-DD`.
- Jalali = presentation only.
- Separate: businessDate, tradeDate, settlementDate, paymentDate, dueDate, marketDate.

## 44 ValuationContext
Explicit context object (`src/core/valuation/valuationContext.js`).  
No implicit “latest” for historical reports.

## Implementation order (unchanged)
```
Loan vertical RELEASE-PROVEN → Crypto → Funds → Stocks → Metals → …
```


## §38–46 Scope notes (Master Spec)

- **Crypto v1:** spot buy/sell, C2C, deposit/withdraw, transfer, fee kinds, airdrop, opening. No futures/DeFi/NFT.
- **Stocks Iran:** instrumentId+ISIN+brokerage; trade≠settlement; T+2; CA engine ownership.
- **Funds:** NAV ≠ transactionPrice; reinvest = one operation.
- **Metals:** fineWeight = gross × purity; premium separate.
- **Cheque:** draft→issued→deposited→cleared|bounced; correction = reversal.
- **Opening:** real operation, sourceType=opening.
- **Planning/Tax:** never mutate journal SoT silently.
