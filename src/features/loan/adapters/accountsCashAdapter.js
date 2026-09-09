import { settle } from "../../../core/domain/cash/settlementAdapter.js";

/** Same Core settle path; account IDs come from full chart */
export const accountsCashAdapter = {
  settle: (args) => settle(args),
};
