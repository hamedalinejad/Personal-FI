import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { ReactNode } from "react";
import { type Gateway } from "../gateway/commandQueryGateway";
import { createHostBoundGateway, getFinancialHost } from "../persistence/browserHostBridge";
import {
  bootstrapRuntime,
  bindInjectedHost,
  loadUiPrefs,
  saveUiPrefs,
  type BookMeta,
  type BootstrapPhase,
} from "../persistence/bootstrapRuntime";
import { tryBootProductionHost } from "../persistence/bootProductionHost";

export type ShellPhase = BootstrapPhase | "bootstrapping";

export type { BookMeta };

export type AppState = {
  phase: ShellPhase;
  book: BookMeta | null;
  offline: boolean;
  hostBound: boolean;
  lastError: { code: string; message: string } | null;
  sheet: string | null;
  bootstrapNote: string | null;
};

type Action =
  | { type: "BOOTSTRAP_RESULT"; phase: ShellPhase; book: BookMeta | null; hostBound: boolean; error: AppState["lastError"]; note: string | null }
  | { type: "COMPLETE_ONBOARDING"; book: BookMeta }
  | { type: "ENTER_RECOVERY"; error: { code: string; message: string } }
  | { type: "CLEAR_RECOVERY" }
  | { type: "OPEN_SHEET"; sheet: string }
  | { type: "CLOSE_SHEET" }
  | { type: "SET_HOST_BOUND"; hostBound: boolean };

function initialState(): AppState {
  // P0-02: never promote to ready from localStorage book cache
  void loadUiPrefs();
  return {
    phase: "bootstrapping",
    book: null,
    offline: true,
    hostBound: false,
    lastError: null,
    sheet: null,
    bootstrapNote: null,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "BOOTSTRAP_RESULT":
      return {
        ...state,
        phase: action.phase,
        book: action.book,
        hostBound: action.hostBound,
        lastError: action.error,
        bootstrapNote: action.note,
      };
    case "COMPLETE_ONBOARDING":
      // Display cache only — economic truth remains in DB via book.create
      saveUiPrefs({ lastBookName: action.book.name, lastBaseCurrency: action.book.baseCurrency });
      return {
        ...state,
        phase: "ready",
        book: action.book,
        lastError: null,
        sheet: null,
      };
    case "ENTER_RECOVERY":
      return { ...state, phase: "recovery", lastError: action.error };
    case "CLEAR_RECOVERY":
      return {
        ...state,
        phase: state.book ? "ready" : state.hostBound ? "onboarding" : "awaiting_host",
        lastError: null,
      };
    case "OPEN_SHEET":
      return { ...state, sheet: action.sheet };
    case "CLOSE_SHEET":
      return { ...state, sheet: null };
    case "SET_HOST_BOUND":
      return { ...state, hostBound: action.hostBound };
    default:
      return state;
  }
}

const AppStateCtx = createContext<AppState | null>(null);
const AppDispatchCtx = createContext<React.Dispatch<Action> | null>(null);
const GatewayCtx = createContext<Gateway | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const gateway = useMemo(() => createHostBoundGateway(), []);
  const [bootOnce, setBootOnce] = useState(false);

  useEffect(() => {
    if (bootOnce) return;
    setBootOnce(true);
    let cancelled = false;
    (async () => {
      const boot = await tryBootProductionHost({ edition: "standalone" });
      if (cancelled) return;
      if (!boot.ok) {
        dispatch({
          type: "BOOTSTRAP_RESULT",
          phase: "awaiting_host",
          book: null,
          hostBound: false,
          error: { code: boot.code, message: boot.message },
          note: `boot_failed:${boot.code}`,
        });
        return;
      }
      const result = await bootstrapRuntime({ edition: "standalone" });
      if (cancelled) return;
      dispatch({
        type: "BOOTSTRAP_RESULT",
        phase: result.phase,
        book: result.book,
        hostBound: result.hostBound || true,
        error: result.error,
        note: result.adapterNote || "production_host_bound",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [bootOnce]);

  // Re-check if host injected after mount (e.g. test harness)
  useEffect(() => {
    const id = window.setInterval(() => {
      const h = getFinancialHost();
      if (h && !state.hostBound) {
        void bootstrapRuntime({ edition: "full" }).then((result) => {
          dispatch({
            type: "BOOTSTRAP_RESULT",
            phase: result.phase,
            book: result.book,
            hostBound: result.hostBound,
            error: result.error,
            note: result.adapterNote,
          });
        });
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [state.hostBound]);

  return (
    <AppStateCtx.Provider value={state}>
      <AppDispatchCtx.Provider value={dispatch}>
        <GatewayCtx.Provider value={gateway}>{children}</GatewayCtx.Provider>
      </AppDispatchCtx.Provider>
    </AppStateCtx.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState outside AppProviders");
  return ctx;
}

export function useAppDispatch() {
  const ctx = useContext(AppDispatchCtx);
  if (!ctx) throw new Error("useAppDispatch outside AppProviders");
  return ctx;
}

export function useGateway(): Gateway {
  const ctx = useContext(GatewayCtx);
  if (!ctx) throw new Error("useGateway outside AppProviders");
  return ctx;
}

export function useCompleteOnboarding() {
  const dispatch = useAppDispatch();
  const gateway = useGateway();
  return useCallback(
    async (input: { bookName: string; baseCurrency: string }) => {
      const host = getFinancialHost();
      if (!host) {
        throw new Error("HOST_BRIDGE_UNWIRED: cannot complete onboarding without FinancialHost");
      }
      const res = await gateway.execute("book.create", {
        name: input.bookName,
        baseCurrency: input.baseCurrency,
      });
      if (!res.ok) {
        throw new Error(res.message || res.code);
      }
      const data = res.data as {
        id?: string;
        bookId?: string;
        name: string;
        baseCurrency: string;
        createdAt?: string | null;
      };
      const id = data.id || data.bookId;
      if (!id) {
        throw new Error("BOOK_ID_MISSING_FROM_CREATE");
      }
      dispatch({
        type: "COMPLETE_ONBOARDING",
        book: {
          id,
          name: data.name,
          baseCurrency: data.baseCurrency,
          createdAt: data.createdAt || "",
        },
      });
    },
    [dispatch, gateway],
  );
}

export { bindInjectedHost };
