/**
 * Phase 11 — book lifecycle state (onboarding → ready).
 */
export function createInitialShellState() {
  return {
    phase: "onboarding", // onboarding | ready | recovery
    book: null,
    baseCurrency: null,
    lastError: null,
    offline: true,
  };
}

export function completeOnboarding(state, { bookId, baseCurrency, bookName }) {
  if (!bookId || typeof bookId !== "string") throw new Error("BOOK_ID_REQUIRED");
  if (!baseCurrency || typeof baseCurrency !== "string") throw new Error("BASE_CURRENCY_REQUIRED");
  return {
    ...state,
    phase: "ready",
    book: { id: bookId, name: bookName || "Personal Book" },
    baseCurrency,
    lastError: null,
  };
}

export function enterRecovery(state, error) {
  return {
    ...state,
    phase: "recovery",
    lastError: {
      code: error?.code || error?.message || "UNKNOWN",
      message: String(error?.message || error),
    },
  };
}

export function clearError(state) {
  return { ...state, lastError: null, phase: state.book ? "ready" : "onboarding" };
}
