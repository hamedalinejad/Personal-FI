---
id: DOC-AUTH-PERS-STATE
title: Financial operation state vs persistence worker state
status: approved
version: 1.0
---

## Financial operation status (public)

```text
draft | posted | voided | failed
```

## Persistence worker / durability (internal)

```text
pending | sql_committed | persisted | persist_failed
```

Transport-only (never public financial status):

```text
temp_written | swapped | …
```

**Rule:** Never expose persistence transport stages as `fin_operations.status`.
