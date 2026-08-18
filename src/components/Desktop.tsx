import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import TopBar, { type Tab } from "./TopBar";
import CommandMenu, { type MenuItem } from "./CommandMenu";
import Window from "./Window";
import SystemScreens, { type Phase, type Power } from "./SystemScreens";
import CookieBanner from "./CookieBanner";
import ParticleNet from "./ParticleNet";
import { OpenCtx } from "../lib/openCtx";
import { SysCtx, type SysAction } from "../lib/sysCtx";
import { FsCtx } from "../lib/fsCtx";
import { ResetCtx } from "../lib/resetCtx";
import { WinsCtx } from "../lib/winsCtx";
import { ThemeCtx, ACCENTS, type ThemePref } from "../lib/themeCtx";
import { LocaleCtx, SwitchLocaleCtx } from "../lib/localeCtx";
import { KlingonCtx } from "../lib/klingonCtx";
import { BootTimeCtx } from "../lib/bootCtx";
import { SiteConfigProvider, type SiteConfig } from "../lib/siteConfig";
import { chrome, chromeKlingon } from "../lib/chrome";
import type { ModuleTab } from "../types";

type Win = { id: string; x: number; y: number; z: number; w?: number; h?: number; booting: boolean; min: boolean; max: boolean; error: boolean };

function useIsDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setD(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return d;
}

function Background({ theme, klingon, pride }: { theme: "light" | "dark"; klingon: boolean; pride: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-aurora" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <div className="bg-scan" />
      <ParticleNet theme={theme} klingon={klingon} pride={pride} />
      <div className="bg-vignette" />
    </div>
  );
}

export type ToOSDesktopProps = {
  config: SiteConfig;
  locale: string;
  onSwitchLocale: (locale: string) => void;
  /** Id of the window to open on first load. */
  initial?: string;
  /** Flat list for the start menu (~/menu). */
  menuItems: MenuItem[];
  /** Resolve a window's tab content by id — synchronous for now. */
  resolveViews: (id: string) => ModuleTab[];
  /** Taskbar/window-header label, e.g. "~/about" or "toShell". */
  resolveBar: (id: string) => string;
  /** Window title shown above tabbed content. */
  resolveTitle: (id: string) => string;
  /** Ids that open instantly without the boot animation (e.g. a terminal). */
  noBootIds?: string[];
  /** Module id to open for a notification's "open changelog" action. If
   *  omitted, no "new version" notification is ever shown. */
  changelogId?: string;
  /** Module id to open when the cookie banner's "details" link is clicked. */
  privacyId?: string;
  /** Called during a factory reset, after ToOS clears its own localStorage
   *  keys, so the consumer can clear its own (shell history, etc). */
  onReset?: () => void;
  /** Fixed bottom-right "{productName} {version} · build {build}" label,
   *  hidden below the lg breakpoint. Defaults to shown. */
  versionBadge?: boolean;
  /** Fired whenever the topmost (focused, non-minimized) window changes —
   *  including to `null` when every window is closed/minimized. Wire this
   *  to your router (e.g. `navigate(hrefFor(id))`) so the last-opened
   *  window becomes a real, deep-linkable browser-history entry. ToOS
   *  itself stays routing-agnostic: it only reports *what* changed. */
  onTopChange?: (id: string | null) => void;
  children?: ReactNode;
};

export default function ToOSDesktop({
  config,
  locale,
  onSwitchLocale,
  initial = "start",
  menuItems,
  resolveViews,
  resolveBar,
  resolveTitle,
  noBootIds = [],
  changelogId,
  privacyId,
  onReset,
  versionBadge = true,
  onTopChange,
}: ToOSDesktopProps) {
  const desktop = useIsDesktop();
  const zc = useRef(10);
  const [wins, setWins] = useState<Win[]>(() => [{ id: initial, x: 320, y: 84, z: 10, booting: false, min: false, max: false, error: false }]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 20, y: 56 });
  const [power, setPower] = useState<Power>("on");
  const [phase, setPhase] = useState<Phase>(null);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [klingon, setKlingonState] = useState(false);
  useEffect(() => {
    try { setKlingonState(localStorage.getItem("toos-klingon") === "1"); } catch { /* ignore */ }
  }, []);
  const setKlingon = (v: boolean) => {
    setKlingonState(v);
    try { localStorage.setItem("toos-klingon", v ? "1" : "0"); } catch { /* ignore */ }
  };

  const [pride, setPrideState] = useState(false);
  useEffect(() => {
    try { setPrideState(localStorage.getItem("toos-pride") === "1"); } catch { /* ignore */ }
  }, []);
  const setPride = (v: boolean) => {
    setPrideState(v);
    try { localStorage.setItem("toos-pride", v ? "1" : "0"); } catch { /* ignore */ }
  };
  useEffect(() => {
    const el = document.documentElement;
    if (pride) el.dataset.pride = "1";
    else delete el.dataset.pride;
  }, [pride]);

  const bootKey = `toos-${config.host}-boot-time`;
  const [bootTime, setBootTimeState] = useState(0);
  useEffect(() => {
    try {
      const s = localStorage.getItem(bootKey);
      if (s) { setBootTimeState(parseInt(s, 10)); return; }
    } catch { /* ignore */ }
    const now = Date.now();
    setBootTimeState(now);
    try { localStorage.setItem(bootKey, String(now)); } catch { /* ignore */ }
  }, [bootKey]);
  const rebootClock = () => {
    const now = Date.now();
    setBootTimeState(now);
    try { localStorage.setItem(bootKey, String(now)); } catch { /* ignore */ }
  };

  const [mature, setMatureState] = useState(false);
  useEffect(() => {
    try { setMatureState(localStorage.getItem("toos-mature") === "1"); } catch { /* ignore */ }
  }, []);
  const setMature = (v: boolean) => {
    setMatureState(v);
    try { localStorage.setItem("toos-mature", v ? "1" : "0"); } catch { /* ignore */ }
  };

  const [pref, setPrefState] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");
  useEffect(() => {
    try {
      const s = localStorage.getItem("toos-theme");
      if (s === "light" || s === "dark" || s === "system") setPrefState(s);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => setResolved(pref === "system" ? (mq.matches ? "light" : "dark") : pref);
    apply();
    if (pref === "system") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [pref]);
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);
  const setPref = (p: ThemePref) => {
    setPrefState(p);
    try { localStorage.setItem("toos-theme", p); } catch { /* ignore */ }
  };

  const [accent, setAccentState] = useState("");
  useEffect(() => {
    try { const a = localStorage.getItem("toos-accent"); if (a) setAccentState(a); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    const hex = ACCENTS.find((a) => a.key === accent)?.hex;
    if (!klingon && !pride && hex) el.style.setProperty("--color-accent", hex);
    else el.style.removeProperty("--color-accent"); // klingon/pride force their own accent
  }, [accent, klingon, pride]);
  const setAccent = (a: string) => {
    setAccentState(a);
    try { localStorage.setItem("toos-accent", a); } catch { /* ignore */ }
  };

  useEffect(() => {
    const el = document.documentElement;
    if (klingon) el.dataset.klingon = "1";
    else delete el.dataset.klingon;
  }, [klingon]);
  const remove = (ids: string[]) => {
    setDeleted((d) => [...new Set([...d, ...ids])]);
    setWins((ws) => ws.map((w) => (ids.includes(w.id) ? { ...w, error: true, booting: false, min: false } : w)));
  };

  const menuInit = useRef(false);
  useEffect(() => {
    if (!menuInit.current && desktop) {
      menuInit.current = true;
      setMenuOpen(true);
    }
  }, [desktop]);

  const open = (id: string) =>
    setWins((ws) => {
      const err = deleted.includes(id);
      const ex = ws.find((w) => w.id === id);
      zc.current += 1;
      if (ex) return ws.map((w) => (w.id === id ? { ...w, z: zc.current, min: false } : w));
      const fresh: Win = { id, x: 300 + (ws.length % 5) * 30, y: 78 + (ws.length % 5) * 30, z: zc.current, booting: !err && !noBootIds.includes(id), min: false, max: false, error: err };
      return desktop ? [...ws, fresh] : [fresh];
    });
  const focus = (id: string) => setWins((ws) => { zc.current += 1; return ws.map((w) => (w.id === id ? { ...w, z: zc.current, min: false } : w)); });
  const close = (id: string) => setWins((ws) => ws.filter((w) => w.id !== id));
  const minimize = (id: string) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, min: true } : w)));
  const tabClick = (id: string) => {
    const w = wins.find((x) => x.id === id);
    if (!w) return;
    if (!w.min && id === topId) minimize(id);
    else focus(id);
  };
  const toggleMax = (id: string) => {
    const willMax = !wins.find((w) => w.id === id)?.max;
    if (willMax) setMenuOpen(false);
    zc.current += 1;
    const z = zc.current;
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, max: !w.max, min: false, z } : w)));
  };
  const move = (id: string, x: number, y: number) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w)));
  const resize = (id: string, w: number, h: number) => setWins((ws) => ws.map((x) => (x.id === id ? { ...x, w, h } : x)));
  const bootDone = (id: string) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, booting: false } : w)));

  const runSys = (a: SysAction) => {
    if (a === "lock") return setPower("locked");
    if (a === "shutdown") {
      setPhase("shutdown");
      window.setTimeout(() => { setPhase(null); setPower("off"); }, 1900);
      return;
    }
    if (a === "reboot") {
      setPhase("shutdown");
      window.setTimeout(() => { setPhase("boot"); setDeleted([]); rebootClock(); }, 1500);
      window.setTimeout(() => setPhase(null), 3600);
      return;
    }
    // wipe (rm -rf / easter egg) — destroys everything, unlike a graceful
    // reboot: also closes every open window, same as a real factory reset.
    setPhase("wipe");
    window.setTimeout(() => { setPhase("boot"); setDeleted([]); setWins([]); rebootClock(); }, 2400);
    window.setTimeout(() => setPhase(null), 4400);
  };
  const [confirm, setConfirm] = useState<"shutdown" | "reboot" | null>(null);
  const [restore, setRestore] = useState(true);
  const [cookieNonce, setCookieNonce] = useState(0);
  const [resetArmed, setResetArmed] = useState(false);

  const doReset = () => {
    try {
      ["toos-theme", "toos-accent", "toos-pride", "toos-klingon", "toos-mature", `toos-${config.host}-cookie-ack`, `toos-${config.host}-notif-state`].forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    setPrefState("system");
    setAccentState("");
    setPrideState(false);
    setKlingonState(false);
    setMatureState(false);
    setResetArmed(false);
    onReset?.();
    setPhase("wipe");
    window.setTimeout(() => { setPhase("boot"); setDeleted([]); setWins([]); setMenuOpen(desktop); rebootClock(); }, 2400);
    window.setTimeout(() => setPhase(null), 4400);
  };

  const sys = (a: SysAction) => {
    if (a === "menu") { setMenuOpen((o) => !o); return; }
    if (a === "cookie") { setCookieNonce((n) => n + 1); return; }
    if (a === "arm-reset") { setResetArmed(true); return; }
    if (a === "reset") { doReset(); return; }
    if (a === "shutdown" || a === "reboot") { setConfirm(a); return; }
    runSys(a);
  };
  const confirmSys = () => {
    if (!confirm) return;
    const a = confirm;
    setConfirm(null);
    if (!restore) setWins([]);
    runSys(a);
  };
  const powerOn = () => { setPower("on"); setDeleted([]); setPhase("boot"); window.setTimeout(() => setPhase(null), 2000); };

  const topId = useMemo(() => {
    const vis = wins.filter((w) => !w.min);
    if (!vis.length) return null;
    return vis.reduce((a, b) => (b.z > a.z ? b : a)).id;
  }, [wins]);
  const tabs: Tab[] = wins.map((w) => ({ id: w.id, bar: resolveBar(w.id), min: w.min }));

  const onTopChangeRef = useRef(onTopChange);
  onTopChangeRef.current = onTopChange;
  useEffect(() => {
    onTopChangeRef.current?.(topId);
  }, [topId]);

  const renderWin = (w: Win) => (
    <Window
      key={w.id}
      bar={resolveBar(w.id)}
      title={resolveTitle(w.id)}
      views={resolveViews(w.id)}
      x={w.x}
      y={w.y}
      z={w.z}
      booting={w.booting}
      error={w.error}
      max={w.max}
      active={w.id === topId}
      w={w.w}
      h={w.h}
      desktop={desktop}
      onFocus={() => focus(w.id)}
      onClose={() => close(w.id)}
      onMinimize={() => minimize(w.id)}
      onToggleMax={() => toggleMax(w.id)}
      onMove={(x, y) => move(w.id, x, y)}
      onResize={(ww, hh) => resize(w.id, ww, hh)}
      onBootDone={() => bootDone(w.id)}
    />
  );

  const c = klingon ? chromeKlingon() : chrome(locale);

  return (
    <LocaleCtx.Provider value={locale}>
    <BootTimeCtx.Provider value={bootTime}>
    <SwitchLocaleCtx.Provider value={onSwitchLocale}>
    <KlingonCtx.Provider value={{ on: klingon, set: setKlingon }}>
    <SiteConfigProvider config={config}>
    <ThemeCtx.Provider value={{ pref, setPref, resolved, accent, setAccent, pride, setPride, mature, setMature }}>
    <OpenCtx.Provider value={open}>
      <SysCtx.Provider value={sys}>
       <ResetCtx.Provider value={resetArmed}>
       <WinsCtx.Provider value={tabs}>
       <FsCtx.Provider value={{ deleted, remove }}>
        <div className="relative min-h-screen">
          <Background theme={resolved} klingon={klingon} pride={pride} />

          {pride && <div aria-hidden className="pride-stripe" />}

          {versionBadge && (
            <div aria-hidden className="pointer-events-none fixed bottom-3 right-4 z-20 hidden select-none font-mono text-[11px] text-faint lg:block">
              {config.productName ?? "ToOS"} {config.version} · build {config.build}
            </div>
          )}

          <TopBar tabs={tabs} topId={topId} onTab={tabClick} onTabMax={toggleMax} onHome={() => setMenuOpen((o) => !o)} onSwitchLocale={onSwitchLocale} onOpenChangelog={changelogId ? () => open(changelogId) : undefined} />

          {menuOpen && (
            <CommandMenu
              desktop={desktop}
              pos={menuPos}
              items={menuItems}
              onOpen={(id) => { open(id); if (!desktop) setMenuOpen(false); }}
              onMove={(x, y) => setMenuPos({ x, y })}
              onClose={() => setMenuOpen(false)}
            />
          )}

          {!desktop && (
            <main className="px-4 pb-24 pt-16">
              {wins.filter((w) => !w.min).map(renderWin)}
            </main>
          )}

          {desktop && (
            <div className="pointer-events-none fixed inset-0 z-30">
              {wins.filter((w) => !w.min).map(renderWin)}
            </div>
          )}

          <CookieBanner onDetails={() => privacyId && open(privacyId)} reopen={cookieNonce} />

          {confirm && (
            <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-[min(92vw,420px)] rounded-xl border border-line bg-ink-2 p-6 shadow-2xl shadow-black/50">
                <h2 className="font-display text-lg font-bold">{confirm === "reboot" ? c.confirmReboot : c.confirmShutdown}</h2>
                <p className="mt-2 text-sm text-muted">{confirm === "reboot" ? c.systemWillRestart : c.systemWillPowerOff}</p>
                <label className="mt-4 flex items-center gap-2 font-mono text-[13px] text-muted">
                  <input type="checkbox" checked={restore} onChange={(e) => setRestore(e.target.checked)} className="accent-accent" />
                  {c.reopenWindows}
                </label>
                <div className="mt-5 flex justify-end gap-2 font-mono text-[13px]">
                  <button type="button" onClick={() => setConfirm(null)} className="rounded-md border border-line px-3 py-1.5 text-muted transition-colors hover:text-paper">
                    {c.cancel}
                  </button>
                  <button type="button" onClick={confirmSys} className="rounded-md bg-accent px-3 py-1.5 font-semibold text-ink transition-opacity hover:opacity-90">
                    {confirm === "reboot" ? c.reboot : c.shutdown}
                  </button>
                </div>
              </div>
            </div>
          )}

          <SystemScreens power={power} phase={phase} onPowerOn={powerOn} onUnlock={() => setPower("on")} />
        </div>
       </FsCtx.Provider>
       </WinsCtx.Provider>
       </ResetCtx.Provider>
      </SysCtx.Provider>
    </OpenCtx.Provider>
    </ThemeCtx.Provider>
    </SiteConfigProvider>
    </KlingonCtx.Provider>
    </SwitchLocaleCtx.Provider>
    </BootTimeCtx.Provider>
    </LocaleCtx.Provider>
  );
}
