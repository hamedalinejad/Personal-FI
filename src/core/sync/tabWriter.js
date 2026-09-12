/**
 * Single-writer semantics for multi-tab browser access.
 * Node harness: in-process map. Browser: navigator.locks + BroadcastChannel.
 */
const writers = new Map();

export function acquireWriter(dbKey, ownerId) {
  const cur = writers.get(dbKey);
  if (cur && cur !== ownerId) {
    const err = new Error("WRITER_REQUIRED");
    err.code = "WRITER_REQUIRED";
    throw err;
  }
  writers.set(dbKey, ownerId);
  return { dbKey, ownerId, role: "writer" };
}

export function releaseWriter(dbKey, ownerId) {
  if (writers.get(dbKey) === ownerId) writers.delete(dbKey);
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

export function _resetWritersForTests() {
  writers.clear();
}
