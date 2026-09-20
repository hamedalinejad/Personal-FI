/**
 * UI capability reader only (R-M25 / R-LICENSE-01).
 * Host remains the enforcement point — this is UX gating.
 */

import type { Gateway } from "./gateway/commandQueryGateway";

export type RuntimeCapabilities = {
  edition: string;
  label: string;
  capabilities: string[];
  allowed: (commandId: string) => boolean;
};

function matchCapability(caps: string[], commandId: string): boolean {
  if (caps.includes("*")) return true;
  if (caps.includes(commandId)) return true;
  for (const c of caps) {
    if (c.endsWith(".*")) {
      const prefix = c.slice(0, -1);
      if (commandId.startsWith(prefix)) return true;
    }
  }
  return false;
}

/**
 * Load capabilities from host meta.license query.
 */
export async function loadCapabilities(gateway: Gateway): Promise<RuntimeCapabilities | null> {
  try {
    const res = await gateway.execute<{
      edition?: string;
      label?: string;
      capabilities?: string[];
    }>("meta.license", {});
    if (!res.ok) return null;
    const data = res.data || {};
    const capabilities = data.capabilities || [];
    return {
      edition: data.edition || "standalone",
      label: data.label || "Standalone",
      capabilities,
      allowed: (commandId: string) => matchCapability(capabilities, commandId),
    };
  } catch {
    return null;
  }
}

/** Six-route IA lock (R-M26) */
export const NAV_ROUTES = Object.freeze([
  { path: "/", id: "home", label: "خانه" },
  { path: "/money", id: "money", label: "پول" },
  { path: "/transactions", id: "transactions", label: "تراکنش‌ها" },
  { path: "/investments", id: "investments", label: "سرمایه‌گذاری" },
  { path: "/loans", id: "loans", label: "وام" },
  { path: "/more", id: "more", label: "بیشتر" },
]);
