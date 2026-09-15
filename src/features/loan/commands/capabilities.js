export function capabilities() {
  return {
    edition: "loan-only",
    status: "PARTIAL",
    implements: ["loan.create", "loan.recordPayment", "loan.reversePayment", "loan.generateSchedule", "loan.previewSchedule"],
    requiresAccountsUi: false,
    cashAdapter: "local",
    sharedCore: true,
    methods: ["declining_balance", "flat_rate", "qarz_al_hasaneh", "bullet"],
    dayCount: ["period_based"],
    commands: ["loan.create", "loan.recordPayment", "loan.reversePayment", "loan.generateSchedule", "loan.previewSchedule"],
    reports: ["loan.statement", "trial_balance_subset"],
    licenseCapability: "loan",
  };
}
