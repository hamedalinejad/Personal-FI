# Recovery Matrix (P0-9)

| Scenario | Expected | Status |
|----------|----------|--------|
| Crash before COMMIT | no operation / no journal | PARTIAL tests |
| Crash after COMMIT before ack | recover from SQLite; idempotent replay | PARTIAL |
| Retry same operationId + hash | idempotent replay | COVERED |
| Retry same id different hash | IDEMPOTENCY_CONFLICT | COVERED |
| Backup/restore | journal + feature ledgers intact | PARTIAL |
| Offline reopen | last durable state | PARTIAL |
| Import unknown fields | preserved on raw record | PARTIAL |
| Standalone boot Loan-only | hidden cash account + journal | PARTIAL |
| Multi-tab non-writer | WRITER_REQUIRED | PARTIAL |

Expand fixtures until all rows COVERED before production.
