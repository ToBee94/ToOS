import { createContext, useContext } from "react";

/** Lets a module's own content close the window it's rendered in — e.g. the
 *  terminal's bare `exit` (not `su`-elevated) closing the shell window. */
export const WindowCtx = createContext<{ close: () => void }>({ close: () => {} });
export const useWindowClose = () => useContext(WindowCtx).close;
