import { createContext, useContext } from "react";

/** Lets window content (e.g. start-page launchers) open other windows/modules by id. */
export const OpenCtx = createContext<(id: string) => void>(() => {});
export const useOpen = () => useContext(OpenCtx);
