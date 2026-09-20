import { useCallback, useEffect, useState } from "react";
import { useGateway } from "../app/AppProviders";

type Axis = "idle" | "initial" | "refreshing";

export function useLoans(enabled = true) {
  const gateway = useGateway();
  const [loading, setLoading] = useState<Axis>("initial");
  const [data, setData] = useState<unknown[]>([]);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const refresh = useCallback(
    async (mode: Axis = "refreshing") => {
      if (!enabled) return;
      setLoading(mode);
      const res = await gateway.execute("listLoans", {});
      if (!res.ok) {
        setErrorCode(res.code);
        setData([]);
        setLoading("idle");
        return;
      }
      const rows = Array.isArray(res.data) ? res.data : (res.data as { loans?: unknown[] })?.loans || [];
      setData(rows as unknown[]);
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
