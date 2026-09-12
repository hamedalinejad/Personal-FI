# Browser durable adapter (P0-B08)

**Status:** NOT_IMPLEMENTED in runtime (see `status.registry.json` → `browser_offline_adapter`).

Target:

```text
same persistence port
→ sql.js in-memory/page
→ durable commit to IndexedDB
→ ACK only after durable write
```

Node adapter remains the reference implementation under `src/core/persistence/`.
