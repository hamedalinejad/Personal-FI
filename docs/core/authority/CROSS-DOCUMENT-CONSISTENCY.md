---
id: DOC-AUTH-XDOC
title: Cross-Document Consistency Pass
status: approved
version: 1.0
updated: 2026-09-12
---

# Goal

For each primary operation, verify one chain:

```text
Table → Column → Field ownership → SoT → FK → Semantic relationship
→ Operation → Domain mutation → Cash effect → Journal effect
→ Fee → FX → Cost basis → Reversal → Report → Rebuild
```

# Closed in scaffold (coding baseline)

- Field kind vocabulary unified (`FIELD-KIND-VOCABULARY`)
- Cost pool Model A + matrix
- Journal ↔ account currency lock
- Stocks trade leg T+n (payable); settle command still SPEC_LOCKED
- Metals foreign fee not summed into tx cashOut
- Crypto inventory account currency = costCurrency

# Still open (release evidence)

- Full schema FK zero-drift vs relationship matrix
- CashSettlementPort on every feature path
- stocks.settle command
- Full golden + recovery families
