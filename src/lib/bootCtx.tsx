import { createContext, useContext } from "react";

/** Epoch ms of the last (simulated) boot — persisted in localStorage per
 *  site, reset on `reboot`/`reset`. Backs the terminal's `uptime`/`top`. */
export const BootTimeCtx = createContext<number>(0);
export const useBootTime = () => useContext(BootTimeCtx);

export function formatUptime(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const min = totalMin % 60;
  if (days > 0) return `${days} day${days === 1 ? "" : "s"},  ${hours}:${String(min).padStart(2, "0")}`;
  if (hours > 0) return `${hours}:${String(min).padStart(2, "0")}`;
  return `${min} min`;
}
