import { createContext, useContext } from "react";

/** Whether the factory-reset button is unlocked (armed via `sudo open settings`). */
export const ResetCtx = createContext<boolean>(false);
export const useResetArmed = () => useContext(ResetCtx);
