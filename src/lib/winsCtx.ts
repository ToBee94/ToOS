import { createContext, useContext } from "react";

/** Currently open windows (id, title-bar label, minimized) — exposed so the
 *  terminal's `top` can list them as processes. */
export type WinInfo = { id: string; bar: string; min: boolean };
export const WinsCtx = createContext<WinInfo[]>([]);
export const useWins = () => useContext(WinsCtx);
