/** Port interface — adapters implement settle() */
export function createCashSettlementPort(adapter) {
  return {
    settle: (args) => adapter.settle(args),
  };
}
