import { useEffect, useMemo, useRef, useState } from "react";
import { useSiteConfig } from "../lib/siteConfig";
import { useChrome } from "../lib/useChrome";

type Notif = { id: string; icon: string; title: string; body: string; onAction?: () => void; actionLabel?: string };

const storeKey = (host: string) => `toos-${host}-notif-state`;
type State = { seenVersion?: string; read: string[]; deleted: string[] };

function load(key: string): State {
  if (typeof localStorage === "undefined") return { read: [], deleted: [] };
  try {
    const s = JSON.parse(localStorage.getItem(key) ?? "{}") as Partial<State>;
    return { seenVersion: s.seenVersion, read: s.read ?? [], deleted: s.deleted ?? [] };
  } catch {
    return { read: [], deleted: [] };
  }
}
const save = (key: string, s: State) => {
  try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* ignore */ }
};

export default function NotificationCenter({ onOpenChangelog }: { onOpenChangelog?: () => void }) {
  const { host, version } = useSiteConfig();
  const c = useChrome();
  const key = storeKey(host);
  const [state, setState] = useState<State>({ read: [], deleted: [] });
  const [panel, setPanel] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Load persisted state after mount (avoids SSR/hydration mismatch). First-ever
  // visit silently records the current version so no "new version" shows on day one.
  useEffect(() => {
    const loaded = load(key);
    if (!loaded.seenVersion) {
      loaded.seenVersion = version;
      save(key, loaded);
    }
    setState(loaded);
  }, [key, version]);

  // close on outside click / Escape
  useEffect(() => {
    if (!panel) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPanel(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  // "New version" notification only exists if the consumer wired up a changelog.
  const notifs = useMemo((): Notif[] => {
    const list: Notif[] = [];
    if (onOpenChangelog && state.seenVersion && state.seenVersion !== version) {
      list.push({
        id: `version-${version}`,
        icon: "✦",
        title: c.newVersion(version),
        body: c.newVersionBody,
        actionLabel: c.openChangelog,
        onAction: onOpenChangelog,
      });
    }
    return list.filter((n) => !state.deleted.includes(n.id));
  }, [state, version, onOpenChangelog, c]);
  const unread = notifs.filter((n) => !state.read.includes(n.id)).length;

  const update = (s: State) => { setState(s); save(key, s); };
  const uniq = (a: string[]) => [...new Set(a)];
  const markRead = (id: string) => update({ ...state, read: uniq([...state.read, id]) });
  const remove = (id: string) => update({ ...state, read: uniq([...state.read, id]), deleted: uniq([...state.deleted, id]) });
  const markAllRead = () => update({ ...state, read: uniq([...state.read, ...notifs.map((n) => n.id)]) });
  const act = (n: Notif) => {
    if (n.onAction) { n.onAction(); update({ ...state, seenVersion: version, read: uniq([...state.read, n.id]) }); }
    else markRead(n.id);
    setPanel(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setPanel((o) => !o)}
        aria-label={c.notifications}
        className={"relative grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-white/[0.06] hover:text-paper " + (panel ? "bg-white/[0.06] text-paper" : "")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={unread ? "bell-ring" : ""} aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-ink shadow-[0_0_8px_var(--color-accent)]">
            {unread}
          </span>
        )}
      </button>

      <div
        className={
          "absolute right-0 top-11 z-[96] w-[min(90vw,22rem)] origin-top-right overflow-hidden rounded-2xl border border-line bg-ink-2/90 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-200 " +
          (panel ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-95 opacity-0")
        }
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-display text-sm font-bold">{c.notifications}</span>
          {unread > 0 && (
            <button type="button" onClick={markAllRead} className="font-mono text-[11px] text-faint transition-colors hover:text-accent">
              {c.markAllRead}
            </button>
          )}
        </div>

        <div className="no-scrollbar max-h-[60vh] overflow-y-auto p-2">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-line text-lg text-faint">✓</span>
              <p className="font-mono text-xs text-faint">{c.caughtUp}</p>
            </div>
          ) : (
            notifs.map((n) => {
              const isRead = state.read.includes(n.id);
              return (
                <div key={n.id} className={"group relative flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.04] " + (isRead ? "opacity-60" : "")}>
                  {!isRead && <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_6px_var(--color-accent)]" />}
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/40 bg-accent/[0.08] text-accent">{n.icon}</span>
                  <button type="button" onClick={() => act(n)} className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-semibold text-paper">{n.title}</div>
                    <div className="text-[12.5px] leading-snug text-muted">{n.body}</div>
                    {n.actionLabel && <div className="mt-1 font-mono text-[11px] text-accent">{n.actionLabel}</div>}
                  </button>
                  <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    {!isRead && (
                      <button type="button" onClick={() => markRead(n.id)} title={c.markRead} aria-label={c.markRead} className="grid h-6 w-6 place-items-center rounded text-faint transition-colors hover:bg-white/10 hover:text-paper">✓</button>
                    )}
                    <button type="button" onClick={() => remove(n.id)} title={c.delete} aria-label={c.delete} className="grid h-6 w-6 place-items-center rounded text-faint transition-colors hover:bg-white/10 hover:text-pink">✕</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
