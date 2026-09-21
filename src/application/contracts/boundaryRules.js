/**
 * Architecture boundary rules (§29 Architecture).
 */

export const UI_FORBIDDEN_IMPORTS = Object.freeze([
  "src/core/db/",
  "src/core/persistence/",
  "better-sqlite3",
  "sql.js",
]);

export const FEATURE_BOUNDARY = Object.freeze({
  rule: "no feature imports another feature's internals",
  allowedShared: ["src/features/_shared/", "src/application/", "src/core/"],
});

export const CORE_FORBIDDEN = Object.freeze(["src/features/"]);

export const OFFICIAL_ROUTES = Object.freeze([
  "/",
  "/money",
  "/transactions",
  "/investments",
  "/loans",
  "/more",
]);

export const FORBIDDEN_TOP_LEVEL_ROUTES = Object.freeze([
  "/crypto",
  "/stocks",
  "/funds",
  "/metals",
  "/tax",
  "/reports",
  "/backup",
  "/import",
]);

export const UI_FORM_FLOW = Object.freeze([
  "Draft",
  "local shape validation",
  "canonical payload construction",
  "Gateway command",
  "Core validation",
  "atomic operation",
  "result",
  "refresh query",
]);

export function isOfficialRoute(route) {
  return OFFICIAL_ROUTES.includes(route);
}

export function isForbiddenTopLevel(route) {
  return FORBIDDEN_TOP_LEVEL_ROUTES.includes(route);
}
