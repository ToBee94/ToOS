import { useLocale, useSwitchLocale } from "../../lib/localeCtx";
import { useKlingon } from "../../lib/klingonCtx";
import { useChrome } from "../../lib/useChrome";
import Seg from "./Seg";

const row = "flex flex-wrap items-center justify-between gap-3";

/** DE/EN + the klingon overlay toggle. If your site supports more than two
 *  locales, write your own tab instead — this one's deliberately minimal to
 *  match ToOS's own bilingual-by-default chrome vocabulary. */
export default function SettingsLanguage() {
  const c = useChrome();
  const locale = useLocale();
  const switchLocale = useSwitchLocale();
  const { on: klingonOn, set: setKlingon } = useKlingon();
  return (
    <div className="space-y-3">
      <div className={row}>
        <span className="text-sm text-muted">{c.settings.language}</span>
        <Seg
          value={klingonOn ? "klingon" : locale}
          onPick={(v) => {
            if (v === "klingon") setKlingon(true);
            else {
              setKlingon(false);
              switchLocale(v);
            }
          }}
          items={[
            { v: "de", label: "DE" },
            { v: "en", label: "EN" },
            { v: "klingon", label: "tlhIngan" },
          ]}
        />
      </div>
      <p className="font-mono text-[11px] text-faint">{c.settings.klingonHint}</p>
    </div>
  );
}
