/**
 * Browser single-writer guard using navigator.locks + IndexedDB lease + BroadcastChannel.
 * Prevents multi-tab concurrent writers from corrupting the book.
 * P0 / Wave-1 requirement.
 */

const LOCK_NAME = "personal-fi-single-writer";
const LEASE_DB = "personal-fi-lease";
const LEASE_STORE = "lease";
const LEASE_KEY = "writer";
const LEASE_TTL_MS = 15_000;
const CHANNEL_NAME = "personal-fi-writer-notify";

/** @type {BroadcastChannel | null} */
let channel = null;
/** @type {string | null} */
let holderId = null;
/** @type {ReturnType<typeof setInterval> | null} */
let heartbeat = null;

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

function closeChannel() {
  if (channel) {
    try {
      channel.close();
    } catch {
      /* ignore */
    }
    channel = null;
  }
}

async function openLeaseDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LEASE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LEASE_STORE)) {
        db.createObjectStore(LEASE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("LEASE_DB_OPEN_FAILED"));
  });
}

async function readLease(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEASE_STORE, "readonly");
    const store = tx.objectStore(LEASE_STORE);
    const req = store.get(LEASE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function writeLease(db, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEASE_STORE, "readwrite");
    const store = tx.objectStore(LEASE_STORE);
    const req = store.put(value, LEASE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearLease(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEASE_STORE, "readwrite");
    const store = tx.objectStore(LEASE_STORE);
    const req = store.delete(LEASE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function now() {
  return Date.now();
}

/**
 * Acquire exclusive write lock. Returns release function.
 * @param {{ tabId?: string, timeoutMs?: number }} [opts]
 * @returns {Promise<() => Promise<void>>}
 */
export async function acquireWriteLock(opts = {}) {
  const tabId = opts.tabId || (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}`);
  const timeoutMs = opts.timeoutMs ?? 10_000;

  if (typeof navigator !== "undefined" && navigator.locks && typeof navigator.locks.request === "function") {
    return new Promise((resolve, reject) => {
      let released = false;
      const timer = setTimeout(() => {
        if (!released) reject(new Error("WRITE_LOCK_TIMEOUT"));
      }, timeoutMs);

      navigator.locks.request(LOCK_NAME, { mode: "exclusive" }, async (lock) => {
        if (!lock) {
          clearTimeout(timer);
          reject(new Error("WRITE_LOCK_DENIED"));
          return;
        }
        holderId = tabId;
        const db = await openLeaseDb();
        await writeLease(db, { holderId: tabId, acquiredAt: now(), expiresAt: now() + LEASE_TTL_MS });
        db.close();

        const ch = getChannel();
        if (ch) ch.postMessage({ type: "writer-acquired", holderId: tabId });

        heartbeat = setInterval(async () => {
          try {
            const d = await openLeaseDb();
            await writeLease(d, { holderId: tabId, acquiredAt: now(), expiresAt: now() + LEASE_TTL_MS });
            d.close();
          } catch {
            /* best-effort heartbeat */
          }
        }, Math.floor(LEASE_TTL_MS / 3));

        clearTimeout(timer);
        resolve(async () => {
          if (released) return;
          released = true;
          if (heartbeat) {
            clearInterval(heartbeat);
            heartbeat = null;
          }
          try {
            const d = await openLeaseDb();
            const current = await readLease(d);
            if (current && current.holderId === tabId) await clearLease(d);
            d.close();
          } catch {
            /* ignore */
          }
          holderId = null;
          if (ch) ch.postMessage({ type: "writer-released", holderId: tabId });
          closeChannel();
        });

        // Keep the lock held until release is called by waiting forever inside the lock callback.
        await new Promise(() => {});
      });
    });
  }

  // Fallback: IDB lease only (no navigator.locks)
  const db = await openLeaseDb();
  const existing = await readLease(db);
  if (existing && existing.expiresAt > now() && existing.holderId !== tabId) {
    db.close();
    throw new Error("WRITE_LOCK_HELD");
  }
  await writeLease(db, { holderId: tabId, acquiredAt: now(), expiresAt: now() + LEASE_TTL_MS });
  db.close();
  holderId = tabId;
  heartbeat = setInterval(async () => {
    try {
      const d = await openLeaseDb();
      await writeLease(d, { holderId: tabId, acquiredAt: now(), expiresAt: now() + LEASE_TTL_MS });
      d.close();
    } catch {
      /* ignore */
    }
  }, Math.floor(LEASE_TTL_MS / 3));

  return async () => {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    try {
      const d = await openLeaseDb();
      const current = await readLease(d);
      if (current && current.holderId === tabId) await clearLease(d);
      d.close();
    } catch {
      /* ignore */
    }
    holderId = null;
    closeChannel();
  };
}

export function getCurrentHolderId() {
  return holderId;
}

/** Test helper: force clear lease (Node / test env) */
export async function __testClearLease() {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
  holderId = null;
  closeChannel();
  try {
    const db = await openLeaseDb();
    await clearLease(db);
    db.close();
  } catch {
    /* ignore when IDB unavailable */
  }
}
