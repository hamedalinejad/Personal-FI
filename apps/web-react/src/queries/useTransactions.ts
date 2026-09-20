import { useCallback, useEffect, useState } from "react";
import { useGateway } from "../app/AppProviders";

export type TxRow = {
  id: string;
  accountId: string;
  operationId: string;
  businessDate: string;
  amount: string;
  currency: string;
  direction: string;
  memo: string | null;
};

type Axis = "idle" | "initial" | "refreshing";

export function useTransactions(enabled = true) {
  const gateway = useGateway();
  const [loading, setLoading] = useState<Axis>("initial");
  const [data, setData] = useState<TxRow[]>([]);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const refresh = useCallback(
    async (mode: Axis = "refreshing") => {
      if (!enabled) return;
      setLoading(mode);
      const res = await gateway.execute<{ transactions: TxRow[] }>("transactionReadModel", { limit: 50 });
      if (!res.ok) {
        setErrorCode(res.code);
        setData([]);
        setLoading("idle");
        return;
      }
      setData(res.data?.transactions || []);
      setErrorCode(null);
      setLoading("idle");
    },
    [gateway, enabled],
  );

  useEffect(() => {
    void refresh("initial");
  }, [refresh]);

  return { loading, data, errorCode, refresh };
}
