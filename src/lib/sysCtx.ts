import { createContext, useContext } from "react";

export type SysAction = "shutdown" | "reboot" | "lock" | "wipe" | "menu" | "cookie" | "arm-reset" | "reset";

/** System actions (shutdown / reboot / lock / rm -rf /) available to the
 *  terminal and the start menu. */
export const SysCtx = createContext<(a: SysAction) => void>(() => {});
export const useSys = () => useContext(SysCtx);
