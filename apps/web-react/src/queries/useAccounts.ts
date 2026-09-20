import { useCallback, useEffect, useState } from "react";
import { useGateway } from "../app/AppProviders";
import { toAccountListItem, type AccountListItemVM } from "../viewModels/accountVm";

type Axis = "idle" | "initial" | "refreshing";

type State = {
  loading: Axis;
  data: AccountListItemVM[];
  totalsByCurrency: Record<string, string>;
  error: string | null;
  errorCode: string | null;
};

/** Query ID locked to hostGateway: listAccounts (not invent accounts.list) */
export function useAccounts(enabled = true) {
  const gateway = useGateway();
  const [state, setState] = useState<State>({
    loading: "initial",
    data: [],
    totalsByCurrency: {},
    error: null,
    errorCode: null,
  });

  const refresh = useCallback(
    async (mode: Axis = "refreshing") => {
      if (!enabled) return;
      setState((s) => ({ ...s, loading: mode }));
      const result = await gateway.execute<{
        accounts: Array<Record<string, unknown>>;
        totalsByCurrency?: Record<string, string>;
      }>("listAccounts", {});
      if (!result.ok) {
        setState({
          loading: "idle",
          data: [],
          totalsByCurrency: {},
          error: result.message,
          errorCode: result.code,
        });
        return;
      }
      const rows = (result.data?.accounts || []).map((r) =>
        toAccountListItem({
          id: String(r.id),
          name: String(r.name),
          accountKind: r.accountKind as string | undefined,
          currency: String(r.currency),
          balance: r.balance as string | null,
          balanceSource: r.balanceSource as string | undefined,
          status: r.status as string | undefined,
        }),
      );
      setState({
        loading: "idle",
        data: rows,
        totalsByCurrency: result.data?.totalsByCurrency || {},
        error: null,
        errorCode: null,
      });
    },
    [gateway, enabled],
  );

  useEffect(() => {
    void refresh("initial");
  }, [refresh]);

  return { ...state, refresh };
}
