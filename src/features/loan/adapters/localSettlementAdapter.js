import { settle } from "../../../core/domain/cash/settlementAdapter.js";

export const localSettlementAdapter = {
  settle: (args) => settle(args),
};
