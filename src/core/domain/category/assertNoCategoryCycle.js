/**
 * REVIEW-014 — category parent_id must not create a cycle.
 * A cannot be a descendant of itself.
 */
export function assertNoCategoryCycle(db, { id, parentId }) {
  if (!parentId) return true;
  if (parentId === id) throw new Error("CATEGORY_CYCLE:self");
  let cur = parentId;
  const seen = new Set([id]);
  while (cur) {
    if (seen.has(cur)) throw new Error(`CATEGORY_CYCLE:${id}->${cur}`);
    seen.add(cur);
    const row = db.prepare(`SELECT parent_id as parentId FROM cat_categories WHERE id = ?`).get(cur);
    if (!row) throw new Error(`CATEGORY_PARENT_MISSING:${cur}`);
    cur = row.parentId;
  }
  return true;
}
