import { createContext, useContext } from "react";

/** Generic "gimmick overlay" toggle (klingon-style easter egg). ToOS uses it
 *  for its own chrome vocabulary; consumer apps can read the same context to
 *  overlay their own content strings too. */
export const KlingonCtx = createContext<{ on: boolean; set: (v: boolean) => void }>({ on: false, set: () => {} });
export const useKlingon = () => useContext(KlingonCtx);
