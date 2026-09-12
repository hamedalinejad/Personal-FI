# Browser offline adapter (OFFLINE-001)

## Status

- **Protocol path (Node-testable):** `durableMemoryAdapter.js` — ACK only after durable marker.
- **Production path (browser):** sql.js + IndexedDB behind the same `persistence/port.js` methods:
  - `openDb` · `persistOperation` · `loadOperation` · `closeAllDbs`

## Required proofs before RELEASE-PROVEN

1. Airplane-mode writes
2. Reload after write
3. Crash mid-persist recovery
4. Backup restore
5. Multi-tab single-writer

Financial operation `status` remains independent of durability_state (see PERSISTENCE-VS-OPERATION-STATE.md).
