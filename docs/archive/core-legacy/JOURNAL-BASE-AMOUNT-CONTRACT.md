> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Journal Base Amount Contract — P0-009 Resolution

**Status:** PROPOSED (requires schema and domain logic updates)

---

## Problem Statement

`fin_journal_lines` has nullable columns:
- `amount_in_base` — nullable
- `exchange_rate_to_base` — nullable

But invariant requires: every posted journal must balance using `amountInBase`.

---

## Required Rules

```
If currency == baseCurrency:
  amount_in_base = amount
  exchange_rate_to_base = 1

If currency != baseCurrency:
  exchange_rate_to_base REQUIRED (not null)
  amount_in_base REQUIRED (not null)
```

Enforce in domain before commit.

---

## Implementation Pattern

### Domain Validation

```typescript
function validateJournalLine(line: JournalLine, baseCurrency: string): void {
  if (line.currency === baseCurrency) {
    // Same currency
    if (line.amount_in_base !== line.amount) {
      throw new Error('amount_in_base must equal amount when currency matches base');
    }
    if (line.exchange_rate_to_base !== '1') {
      throw new Error('exchange_rate_to_base must be 1 when currency matches base');
    }
  } else {
    // Different currency
    if (!line.exchange_rate_to_base || line.exchange_rate_to_base === '') {
      throw new Error('exchange_rate_to_base is required when currency differs from base');
    }
    if (!line.amount_in_base || line.amount_in_base === '') {
      throw new Error('amount_in_base is required when currency differs from base');
    }
  }
}
```

### Schema-Level Constraints (Optional)

SQLite doesn't support complex conditional CHECK constraints, but can add partial unique indexes or triggers:

```sql
-- Example: trigger to enforce base amount calculation
CREATE TRIGGER journal_base_amount_check
BEFORE INSERT ON fin_journal_lines
FOR EACH ROW
BEGIN
  -- Domain should enforce this before insert
  -- SQLite CHECK cannot easily enforce conditional NULL requirements
END;
```

**Note:** Best practice is to enforce in domain logic, not schema.

---

## Posting Flow

```typescript
function postJournal(operation: FinancialOperation): void {
  const baseCurrency = operation.base_currency;
  
  // Calculate base amounts for each line
  const linesWithBase = operation.journal_lines.map(line => {
    if (line.currency === baseCurrency) {
      return {
        ...line,
        amount_in_base: line.amount,
        exchange_rate_to_base: '1'
      };
    } else {
      // Fetch exchange rate at transaction time
      const rate = getExchangeRate(line.currency, baseCurrency, operation.business_date);
      return {
        ...line,
        amount_in_base: multiply(line.amount, rate),
        exchange_rate_to_base: rate
      };
    }
  });
  
  // Validate balanced
  const totalDebit = linesWithBase
    .filter(l => l.side === 'debit')
    .reduce((sum, l) => sum + Decimal(l.amount_in_base), new Decimal(0));
  
  const totalCredit = linesWithBase
    .filter(l => l.side === 'credit')
    .reduce((sum, l) => sum + Decimal(l.amount_in_base), new Decimal(0));
  
  if (!totalDebit.equals(totalCredit)) {
    throw new Error(`Journal does not balance: debit=${totalDebit}, credit=${totalCredit}`);
  }
  
  // Insert with validated base amounts
  insertJournalLines(linesWithBase);
}
```

---

## Migration Steps

1. Update domain logic to calculate `amount_in_base` and `exchange_rate_to_base` before insert
2. Enforce rules:
   - Same currency: `amount_in_base = amount`, `exchange_rate_to_base = 1`
   - Different currency: both fields required
3. For existing null values, backfill from journal or reject
4. Add validation in all journal creation paths

---

## Key Rules

1. **No null base amounts for posted journals**
2. **Same currency = trivial conversion (rate=1)**
3. **Different currency = required rate + calculated base**
4. **Domain validation before DB insert**