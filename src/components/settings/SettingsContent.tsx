import { useTheme } from "../../lib/themeCtx";
import { useChrome } from "../../lib/useChrome";
import Seg from "./Seg";

const row = "flex flex-wrap items-center justify-between gap-3";

/** Generic "mature content" gate — relabel via chrome overrides or write your
 *  own tab if you need site-specific wording (e.g. an age-rating system). */
export default function SettingsContent() {
  const c = useChrome();
  const { mature, setMature } = useTheme();
  return (
    <div className="space-y-4">
      <div className={row}>
        <div className="min-w-0">
          <span className="text-sm text-muted">{c.settings.mature}</span>
          <p className="font-mono text-[11px] text-faint">{c.settings.matureDesc}</p>
        </div>
        <Seg value={mature ? "on" : "off"} onPick={(v) => setMature(v === "on")} items={[{ v: "off", label: c.settings.off }, { v: "on", label: c.settings.on }]} />
      </div>
    </div>
  );
}
