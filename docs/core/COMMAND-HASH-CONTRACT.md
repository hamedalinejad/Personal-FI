> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Command Hash (BUG-CUR-029 LOCKED)

Canonical hash is **always** computed server-side from normalized economic identity.

Caller-supplied `commandHash` is treated as `clientCommandHash` diagnostic only.
Mismatch → `OP_COMMAND_HASH_MISMATCH`.
