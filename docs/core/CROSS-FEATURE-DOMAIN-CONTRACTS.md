# Cross-Feature Domain Contracts (LOCKED)

**Authority for domain rules across investment/cash/import/Iran.**  
Implementation order remains: Loan-only → Crypto → Funds → Stocks → Metals.  
These contracts apply when each Feature is built — AI must not invent alternate economics.

---

## 31. Crypto

Every investment command carries:

```text
operationId · instrumentId · businessDate · source/provenance
```

Buy preserves:

```text
grossQuantity · feeQuantity · netQuantity · feeRole
costTotal · costCurrency · price · priceAsOf
externalTxId · networkId · exchangeId
```

| Rule | Formula / behavior |
|------|--------------------|
| Fee from received | `net = gross − fee` |
| Internal transfer | same economics; no realized P&L; cost basis moves |
| C2C | destination cost = economic consideration (+ capitalized fee if policy); **never** spot mark alone |

Identity: `ref_instruments.id` only; symbol/assetKey are labels/indexes.

---

## 32. Stocks Iran

| Preserve | Note |
|----------|------|
| `ref_instruments.id` | canonical |
| ISIN | attribute |
| brokerageId | venue |

Trade fields: quantity, price, tradeDate, settlementDate, commission, tax, otherFee, currency, brokerageId.

**T+2:** trade event → payable/receivable → settlement event → cash.  
Do **not** collapse tradeDate and settlementDate.

Corporate actions: **CA engine only** owns mutation + provenance.

---

## 33. Funds

Preserve independently: **NAV** and **transactionPrice**.

| Action | Rule |
|--------|------|
| Subscribe | accounting cost uses transactionPrice; valuation may use NAV |
| Reinvest | one operation: distribution income leg + subscription leg; no fake duplicate external cash |

---

## 34. Metals

Fields: grossWeight, unit, purityCode, purityRatio, fineWeight, metalPrice, premium, fee, currency, platform, physicalDelivery.

```text
fineWeight = grossWeight × purityRatio
```

Premium ≠ metal price. Physical delivery moves holding platform → physical with provenance + cost preserved.

---

## 35. Cheque

```text
draft → issued → deposited → cleared
issued/deposited → bounced
```

Preserve: sayadiId, chequeNumber, dueDate, clearedDate, bouncedDate, bouncedReason, operationId.  
Correction = reverse + new operation.

---

## 36. Cash

```text
SoT = fin_accounts + fin_journal_lines
```

Feature-owned `cashBalance` is **not** independent truth.  
`acc_transactions` = event/projection only.

| Edition | Adapter |
|---------|---------|
| Standalone | LocalSettlementAdapter |
| Full | AccountsCashAdapter (optional) |

---

## 37. Feature independence

Editions: loan-only, crypto-only, fund-only, stocks-only, metals-only, full.  
Each runs without Accounts UI. Core always present.  
License may hide capability; **never** erase history.

---

## 38. FX

v1 helper: direct / inverse / one pivot / Decimal / provenance / contextHash.

Production residual: as-of filter, source priority, stale, multi-hop deterministic path, ValuationContext, missing ≠ zero.

Path tie-break: fewest hops → source priority → lexical path.  
Historical conversion uses rate valid at cutoff.

---

## 39. Price

Persistence truth: `price_history`.  
Precedence: manual > cache > online.  
Fields: quoteType, asOf, isStale, provenance.  
Public APIs reject numeric money (no coercion).

---

## 40. Rebuild determinism

```text
same ledger + engineVersions + ValuationContext + dataset = same report
```

Order: business/effective date → createdAt → stable ID.  
Snapshots deletable and rebuildable without result change.

---

## 41. Import / preservation

```text
raw → hash → unknownFields → normalize → map → override? → operation
```

Never discard: unknownFields, sourceProvider, sourceReference, sourceDocumentId, providerTxId, batchId, rawRecordHash.  
Raw immutable.

---

## 42. Iran money

| Storage | Display |
|---------|---------|
| IRR (Rial) | Toman optional UI |

```text
1 Toman = 10 IRR
```

Toman is input/display convention, **not** a second book currency. Normalize before journal. Preserve raw unit when provenance requires.

---

## 43. Dates

Storage: Gregorian `YYYY-MM-DD`. Jalali = presentation only.  
No locale parsing in Core.

Separate fields: businessDate, tradeDate, settlementDate, paymentDate, dueDate, marketDate.

---

## 44. ValuationContext

Historical reports require explicit:

```json
{
  "valuationAsOf": "YYYY-MM-DD",
  "priceAsOf": "YYYY-MM-DD?",
  "fxAsOf": "YYYY-MM-DD?",
  "cashAsOf": "YYYY-MM-DD?",
  "liabilityAsOf": "YYYY-MM-DD?",
  "baseCurrency": "IRR",
  "valuationMode": "optional",
  "cashScope": "optional",
  "liabilityScope": "optional"
}
```

**Forbidden:** implicit “latest everything” for historical reports unless policy explicitly selects it.
