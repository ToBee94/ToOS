import { createContext, useContext } from "react";

/** "Filesystem" state for the rm easter egg: which modules have been deleted.
 *  reboot / rm -rf / restore everything. */
export const FsCtx = createContext<{ deleted: string[]; remove: (ids: string[]) => void }>({
  deleted: [],
  remove: () => {},
});
export const useFs = () => useContext(FsCtx);
