# Money & Decimal Policy (IRR / multi-currency)

## Persistence

- All money, quantity, rate, price fields: **TEXT decimal string**
- Engine arithmetic: **decimal.js** only (never IEEE number for finance)
- Canonicalize before `commandHash` / persist (no scientific notation, no leading `+`, finite only)

## Iran

- **Stored currency for Iranian money = IRR**
- **Toman = display/input convenience only** (×10 Rial)
- No separate DB currency for Toman

## Rounding

See `rounding/Rounding-Policy.md` for scale by currency/instrument (IRR 0 dp store policy, USD 2, crypto qty scales, etc.).

## Related

- `iran/README.md` — Iran Core + Toman layer
- `CANONICAL-FINANCIAL-REQUIREMENTS.md` — money section
- `ARCHITECTURE-LOCKED.md` — constitution

## ضد-الگوی ممنوع

```text
❌ amount_toman + amount_rial columns
❌ currency = 'TOM' | 'IRT' as ledger currencies
❌ storing both units for the same fact
✅ amount TEXT IRR + UI unit preference
```
