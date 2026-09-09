/**
 * crypto public API — scaffold.
 * Implement commands per docs/core/IMPLEMENTATION-READY-FEATURES.md
 * Pattern: src/features/loan/**
 */
export function capabilities() {
  return {
    edition: "crypto-only",
    status: "SPECIFIED",
    implements: [],
  };
}

export const commands = {};
export const queries = {};
