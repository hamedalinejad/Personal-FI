/**
 * API-003 — stable order for financial queries.
 * Default: businessDate ASC, createdAt ASC, id ASC
 * Cursor encodes all order keys.
 */
export const DEFAULT_ORDER = Object.freeze(["businessDate", "createdAt", "id"]);

export function encodeCursor(row, orderKeys = DEFAULT_ORDER) {
  const payload = {};
  for (const k of orderKeys) {
    payload[k] = row[k] ?? row[k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)] ?? null;
  }
  return Buffer.from(JSON.stringify({ orderKeys, payload }), "utf8").toString("base64url");
}

export function decodeCursor(cursor) {
  if (!cursor) return null;
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
}

/** SQL-ish predicate after cursor for (business_date, created_at, id) */
export function cursorWhereClause(cursor, {
  businessDateCol = "business_date",
  createdAtCol = "created_at",
  idCol = "id",
} = {}) {
  const c = typeof cursor === "string" ? decodeCursor(cursor) : cursor;
  if (!c?.payload) return { sql: "1=1", params: [] };
  const p = c.payload;
  return {
    sql: `(
      ${businessDateCol} > ?
      OR (${businessDateCol} = ? AND ${createdAtCol} > ?)
      OR (${businessDateCol} = ? AND ${createdAtCol} = ? AND ${idCol} > ?)
    )`,
    params: [
      p.businessDate,
      p.businessDate,
      p.createdAt,
      p.businessDate,
      p.createdAt,
      p.id,
    ],
  };
}
