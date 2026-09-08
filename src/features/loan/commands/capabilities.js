export function capabilities() {
  return {
    edition: "loan-only",
    cashAdapter: "local",
    methods: ["declining_balance", "flat_rate", "qarz_al_hasaneh", "bullet"],
    dayCount: ["period_based"],
  };
}
