# BUG-FINAL-011…020 Status

| ID | Status | Evidence |
|----|--------|----------|
| 011 Fund redeem qty/proceeds | FIXED | FUND_*_NONPOSITIVE |
| 012 Stocks sell qty/price/fee | FIXED | STOCK_* validation |
| 013 Metals sell qty/proceeds | FIXED | METAL_*_NONPOSITIVE |
| 014 Metals delivery qty | FIXED | METAL_DELIVERY_QTY_NONPOSITIVE |
| 015 sourceType/sourceReference on record | FIXED | record + INSERT |
| 016 normalizedRequest full envelope | FIXED | temporal + source fields |
| 017 replay uses relational journal | FIXED | loadOperationSync always |
| 018 result_hash written | FIXED | sha256 on snapshot |
| 019 JSON path shared validation | FIXED | balance + amountInBase |
| 020 prepareDomain operationContext | FIXED | frozen canonical context |
