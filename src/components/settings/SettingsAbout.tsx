import { useEffect, useState } from "react";
import { useSiteConfig } from "../../lib/siteConfig";
import { useChrome } from "../../lib/useChrome";
import { useResetArmed } from "../../lib/resetCtx";
import { useSys } from "../../lib/sysCtx";
import { useOpen } from "../../lib/openCtx";

export default function SettingsAbout() {
  const { version, build } = useSiteConfig();
  const c = useChrome();
  const armed = useResetArmed();
  const sys = useSys();
  const open = useOpen();
  const [info, setInfo] = useState({ ua: "", plat: "", scr: "" });
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setInfo({ ua: navigator.userAgent, plat: navigator.platform || "—", scr: `${window.innerWidth}×${window.innerHeight}` });
    }
  }, []);
  const check = () => {
    setChecking(true);
    setStatus("");
    window.setTimeout(() => {
      setChecking(false);
      setStatus(c.settings.upToDate);
    }, 1600);
  };
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-1 font-mono text-[12px]">
        <dt className="text-faint">{c.settings.version}</dt>
        <dd className="text-muted">{version}</dd>
        <dt className="text-faint">{c.settings.build}</dt>
        <dd className="text-muted">{build}</dd>
        <dt className="text-faint">{c.settings.browser}</dt>
        <dd className="break-all text-muted">{info.ua || "—"}</dd>
        <dt className="text-faint">{c.settings.platform}</dt>
        <dd className="text-muted">{info.plat || "—"}</dd>
        <dt className="text-faint">{c.settings.screen}</dt>
        <dd className="text-muted">{info.scr || "—"}</dd>
      </dl>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-muted transition-colors hover:text-paper disabled:opacity-60"
        >
          {checking ? c.settings.checking : c.settings.checkUpdates}
        </button>
        <button
          type="button"
          onClick={() => open("changelog")}
          className="rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-muted transition-colors hover:text-paper"
        >
          {c.settings.releaseNotes}
        </button>
        {status && <span className="font-mono text-[12px] text-accent">{status}</span>}
      </div>

      {armed && (
        <div className="mt-1 rounded-md border border-pink/40 bg-pink/5 p-3">
          <p className="font-mono text-[11px] font-semibold text-pink">{c.dangerZone}</p>
          <p className="mt-1 text-[12px] text-muted">{c.dangerDesc}</p>
          <button
            type="button"
            onClick={() => sys("reset")}
            className="mt-2 rounded-md bg-pink px-3 py-1.5 font-mono text-[12px] font-semibold text-ink transition-transform hover:-translate-y-px"
          >
            {c.factoryReset}
          </button>
        </div>
      )}
    </div>
  );
}
