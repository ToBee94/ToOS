import { useTheme, ACCENTS, type ThemePref } from "../../lib/themeCtx";
import { useChrome } from "../../lib/useChrome";
import Seg from "./Seg";

const row = "flex flex-wrap items-center justify-between gap-3";

export default function SettingsDesign() {
  const c = useChrome();
  const { pref, setPref, accent, setAccent, pride, setPride } = useTheme();
  const activeAccent = accent || ACCENTS[0].key;
  return (
    <div className="space-y-5">
      <div className={row}>
        <span className="text-sm text-muted">{c.settings.theme}</span>
        <Seg
          value={pref}
          onPick={(v) => setPref(v as ThemePref)}
          items={[
            { v: "system", label: c.settings.themeSystem },
            { v: "light", label: c.settings.themeLight },
            { v: "dark", label: c.settings.themeDark },
          ]}
        />
      </div>
      <div className={row}>
        <span className="text-sm text-muted">{c.settings.primaryColour}</span>
        <div className="flex gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              aria-label={a.key}
              onClick={() => setAccent(a.key)}
              className={"h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-ink transition " + (activeAccent === a.key ? "ring-paper" : "ring-transparent hover:ring-line")}
              style={{ background: a.hex }}
            />
          ))}
        </div>
      </div>
      <div className={row}>
        <span className="text-sm text-muted">{c.settings.pride} 🏳️‍🌈</span>
        <Seg value={pride ? "on" : "off"} onPick={(v) => setPride(v === "on")} items={[{ v: "off", label: c.settings.off }, { v: "on", label: c.settings.on }]} />
      </div>
      <p className="font-mono text-[11px] text-faint">{c.settings.motionNote}</p>
    </div>
  );
}
