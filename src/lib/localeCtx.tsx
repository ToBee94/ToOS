import { createContext, useContext } from "react";

/** Current locale, as decided by the consumer app (usually from the URL) and
 *  passed into <ToOSDesktop locale="de" .../>. ToOS itself never derives it. */
export const LocaleCtx = createContext<string>("en");
export const useLocale = () => useContext(LocaleCtx);

/** Requests a locale switch — wired to <ToOSDesktop onSwitchLocale={...}>.
 *  How the consumer actually changes locale (routing, state, ...) is up to
 *  them; ToOS just calls this. */
export const SwitchLocaleCtx = createContext<(locale: string) => void>(() => {});
export const useSwitchLocale = () => useContext(SwitchLocaleCtx);
