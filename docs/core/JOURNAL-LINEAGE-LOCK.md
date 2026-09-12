# Journal Lineage (BUG-CUR-021 LOCKED)

Canonical path:

```
fin_journal_lines.entry_id
  → fin_journal_entries.id
  → fin_journal_entries.operation_id
  → fin_operations.id
```

Do **not** add `operation_id` on `fin_journal_lines` unless a migration deliberately denormalizes with CHECK equality triggers.

Queries that need operation-scoped lines MUST join through `fin_journal_entries`.
