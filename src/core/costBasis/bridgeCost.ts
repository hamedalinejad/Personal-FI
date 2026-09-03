import { transferCost, type TransferCostResult } from './transferCost.js';

/** same_owner_bridge: cost carry to target instrument; realized = 0. Reuses single-release transfer math. */
export function bridgeCost(params: {
  beforeCost: string;
  gross: string;
  net: string;
  feeQty: string;
}): TransferCostResult & { realized: '0' } {
  return { ...transferCost(params), realized: '0' };
}
