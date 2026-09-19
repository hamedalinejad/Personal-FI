/**
 * Phase 10 — Web shell route map.
 * Authority: docs/PRODUCT.md (six top-level routes LOCKED).
 * Phase-10 request listed /reports /planning /settings as top-level;
 * those are destinations under /more so Feature≠Page and ≤6 roots hold.
 */
export const TOP_LEVEL_ROUTES = Object.freeze([
  "/",
  "/money",
  "/transactions",
  "/investments",
  "/loans",
  "/more",
]);

/** Nested destinations under /more (not top-level routes) */
export const MORE_DESTINATIONS = Object.freeze([
  "/more/reports",
  "/more/planning",
  "/more/settings",
  "/more/backup",
  "/more/import",
  "/more/export",
]);

export function isTopLevelRoute(path) {
  if (!path || typeof path !== "string") return false;
  const p = path.split("?")[0].replace(/\/$/, "") || "/";
  return TOP_LEVEL_ROUTES.includes(p);
}

export function resolveShellPath(path) {
  const p = (path || "/").split("?")[0].replace(/\/$/, "") || "/";
  if (TOP_LEVEL_ROUTES.includes(p)) return { route: p, sheet: null };
  if (MORE_DESTINATIONS.includes(p) || p.startsWith("/more/")) {
    return { route: "/more", sheet: p };
  }
  // feature deep-links open as sheets on parent route
  if (p.startsWith("/investments/")) return { route: "/investments", sheet: p };
  if (p.startsWith("/loans/")) return { route: "/loans", sheet: p };
  if (p.startsWith("/money/")) return { route: "/money", sheet: p };
  if (p.startsWith("/transactions/")) return { route: "/transactions", sheet: p };
  return { route: "/", sheet: null, unknown: true };
}
