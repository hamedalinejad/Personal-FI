/**
 * IndexedDB byte store for SQLite database persistence.
 * Stores the entire SQLite file as a single ArrayBuffer under a fixed key.
 * Wave-1 / browser durable ACK requirement.
 */

const DB_NAME = "personal-fi-bytes";
const STORE = "db";
const KEY = "sqlite";
const META_KEY = "meta";

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("INDEXEDDB_UNAVAILABLE"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB_OPEN_FAILED"));
  });
}

/**
 * @param {ArrayBuffer|Uint8Array} bytes
 * @param {{ schemaVersion?: string, bookId?: string }} [meta]
 */
export async function saveDbBytes(bytes, meta = {}) {
  const db = await openDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const buf = bytes instanceof ArrayBuffer ? bytes : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      store.put(buf, KEY);
      store.put(
        {
          savedAt: new Date().toISOString(),
          byteLength: buf.byteLength,
          schemaVersion: meta.schemaVersion || "1",
          bookId: meta.bookId || null,
        },
        META_KEY
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("IDB_SAVE_FAILED"));
      tx.onabort = () => reject(tx.error || new Error("IDB_SAVE_ABORTED"));
    });
  } finally {
    db.close();
  }
}

/**
 * @returns {Promise<{ bytes: ArrayBuffer|null, meta: object|null }>}
 */
export async function loadDbBytes() {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const bytesReq = store.get(KEY);
      const metaReq = store.get(META_KEY);
      let bytes = null;
      let meta = null;
      bytesReq.onsuccess = () => {
        bytes = bytesReq.result || null;
      };
      metaReq.onsuccess = () => {
        meta = metaReq.result || null;
      };
      tx.oncomplete = () => resolve({ bytes, meta });
      tx.onerror = () => reject(tx.error || new Error("IDB_LOAD_FAILED"));
    });
  } finally {
    db.close();
  }
}

/**
 * Delete stored database (for clean restore / recovery).
 */
export async function clearDbBytes() {
  const db = await openDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.delete(KEY);
      store.delete(META_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("IDB_CLEAR_FAILED"));
    });
  } finally {
    db.close();
  }
}

/**
 * @returns {Promise<boolean>}
 */
export async function hasStoredDb() {
  const { bytes } = await loadDbBytes();
  return !!(bytes && bytes.byteLength > 0);
}
