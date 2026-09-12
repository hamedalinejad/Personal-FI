/**
 * Single-writer semantics for multi-tab browser access.
 * Node harness: in-process map.
 * Browser: navigator.locks + BroadcastChannel (same API).
 */
const writers = new Map();
const listeners = new Set();

export function acquireWriter(dbKey, ownerId) {
  const cur = writers.get(dbKey);
  if (cur && cur !== ownerId) {
    const err = new Error("WRITER_REQUIRED");
    err.code = "WRITER_REQUIRED";
    throw err;
  }
  writers.set(dbKey, ownerId);
  broadcast({ type: "writer-acquired", dbKey, ownerId });
  return { dbKey, ownerId, role: "writer" };
}

export function releaseWriter(dbKey, ownerId) {
  if (writers.get(dbKey) === ownerId) {
    writers.delete(dbKey);
    broadcast({ type: "writer-released", dbKey, ownerId });
  }
}

export function assertWriter(dbKey, ownerId) {
  if (writers.get(dbKey) !== ownerId) {
    const err = new Error("WRITER_REQUIRED");
    err.code = "WRITER_REQUIRED";
    throw err;
  }
}

export function tryWrite(dbKey, ownerId, fn) {
  assertWriter(dbKey, ownerId);
  return fn();
}

/** Browser: subscribe to writer changes (BroadcastChannel polyfill in tests). */
export function onWriterEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function broadcast(evt) {
  for (const fn of listeners) {
    try {
      fn(evt);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Simulate multi-tab: two owners cannot both write.
 * In browser, wrap with navigator.locks.request(dbKey, ...).
 */
export async function withBrowserLock(dbKey, ownerId, fn) {
  // Node/test path — same semantics as locks
  acquireWriter(dbKey, ownerId);
  try {
    return await fn();
  } finally {
    releaseWriter(dbKey, ownerId);
  }
}

export function _resetWritersForTests() {
  writers.clear();
  listeners.clear();
}
