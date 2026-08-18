import { useLocale } from "./localeCtx";
import { useKlingon } from "./klingonCtx";
import { chrome, chromeKlingon, type ChromeStrings } from "./chrome";

/** ToOS's own chrome copy for the current locale, with the klingon overlay
 *  applied when active. */
export function useChrome(): ChromeStrings {
  const locale = useLocale();
  const { on } = useKlingon();
  return on ? chromeKlingon() : chrome(locale);
}
