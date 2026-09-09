/**
 * Deterministic event ordering for rebuild:
 * business/effective date → createdAt → stable id
 */
export function compareEvents(a, b) {
  const d = String(a.businessDate || a.effectiveDate || "").localeCompare(
    String(b.businessDate || b.effectiveDate || ""),
  );
  if (d !== 0) return d;
  const c = String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
  if (c !== 0) return c;
  return String(a.id || a.operationId || "").localeCompare(String(b.id || b.operationId || ""));
}

export function sortEvents(events) {
  return [...events].sort(compareEvents);
}
