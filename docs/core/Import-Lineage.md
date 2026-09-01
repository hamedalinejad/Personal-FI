# Import Lineage & Provenance (P0)

## sourceType عمومی (همه Featureها)

`manual` · `import` · `bank_statement` · `broker_statement` · `exchange_api` · `api` · `system` · `opening` · `correction` · `migration`

همراه با:

- `sourceReference`
- `sourceDocumentId`
- `importBatchId`
- `sourceTransactionId`

## زنجیره Import Lineage

```text
Import Batch
     ↓
Imported Record
     ↓
Financial Operation
     ↓
Journal
     ↓
Domain Event
```

Query معکوس اجباری (قرارداد):

```text
showOrigin(operationId)
→ batch, external id, document, sourceType, sourceReference
```

کاربر باید بتواند بپرسد: «این ۸۵ میلیون از کجا آمد؟»

مرجع: `Feature-API-Contract.md` · `Import-Infrastructure.md`
