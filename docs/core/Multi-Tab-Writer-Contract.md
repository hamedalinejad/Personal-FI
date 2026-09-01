# Single Writer / Multi-Tab (P0)

sql.js: **یک active writer**.

قرارداد:

| موضوع | الزام |
|--------|--------|
| Writer lock acquisition | Web Locks API |
| Lease + heartbeat | جلوگیری از stale writer |
| Crash recovery | lease expire → reclaim |
| Reader notification | BroadcastChannel |
| Version conflict | reader می‌بیند DB version عوض شد → reload/refetch |

ترکیب پیشنهادی: **Web Locks + BroadcastChannel + DB writer lease** — نه فقط یکی.

بعد از crash وسط Operation→Journal→Snapshot→IndexedDB:

detect incomplete → verify → recover/WAL → rebuild deterministic.
