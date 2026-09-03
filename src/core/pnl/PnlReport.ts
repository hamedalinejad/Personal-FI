export type AttributionStatus = 'exact' | 'degraded' | 'unavailable';

export type PnlReport = {
  primary: {
    realizedPnlBase: string;
    unrealizedPnlBase: string;
    recognizedIncomeBase: string;
    recognizedExpenseBase: string;
    primaryPnlBase: string;
  };
  attribution?: {
    status: AttributionStatus;
    assetPriceEffectBase: string | null;
    fxEffectBase: string | null;
    feeEffectBase: string | null;
    costBasisResidualEffectBase: string | null;
  };
};
