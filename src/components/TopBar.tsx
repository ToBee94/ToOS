import { useRef } from "react";
import NotificationCenter from "./NotificationCenter";
import { useLocale } from "../lib/localeCtx";
import { useSiteConfig } from "../lib/siteConfig";

export type Tab = { id: string; bar: string; min: boolean };

function LangSwitch({ locale, onSwitch }: { locale: string; onSwitch: (l: string) => void }) {
  const other = locale === "de" ? "en" : "de";
  return (
    <button
      type="button"
      onClick={() => onSwitch(other)}
      className="rounded px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:bg-white/[0.06] hover:text-accent"
      aria-label={other === "en" ? "Switch to English" : "Zu Deutsch wechseln"}
    >
      {other.toUpperCase()}
    </button>
  );
}

export default function TopBar({
  tabs,
  topId,
  onTab,
  onTabMax,
  onHome,
  onSwitchLocale,
  onOpenChangelog,
}: {
  tabs: Tab[];
  topId: string | null;
  onTab: (id: string) => void;
  onTabMax: (id: string) => void;
  onHome: () => void;
  onSwitchLocale: (locale: string) => void;
  onOpenChangelog?: () => void;
}) {
  const locale = useLocale();
  const { brand } = useSiteConfig();
  // distinguish single click (minimize/restore) from double click (maximize)
  const clickTimer = useRef<number | null>(null);
  return (
    <header className="fixed inset-x-0 top-0 z-[90] flex h-11 items-center gap-2 border-b border-line bg-ink-2/70 px-3 font-mono text-xs backdrop-blur-md">
      <button
        type="button"
        onClick={onHome}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-paper transition-colors hover:bg-white/[0.06]"
        aria-label="menu"
      >
        <span className="text-accent">⌂</span>
        <span className="brand-toos font-display font-bold tracking-tight">{brand}</span>
      </button>

      <span className="mx-1 h-4 w-px shrink-0 bg-line" />

      <div className="no-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto">
        {tabs.length === 0 && <span className="text-faint">no windows</span>}
        {tabs.map((w) => {
          const active = w.id === topId && !w.min;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                if (clickTimer.current) return; // second click of a dbl-click — ignore
                clickTimer.current = window.setTimeout(() => { clickTimer.current = null; onTab(w.id); }, 50);
              }}
              onDoubleClick={() => {
                if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null; }
                onTabMax(w.id);
              }}
              className={
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 transition-colors " +
                (active ? "bg-white/[0.08] text-paper" : "text-muted hover:bg-white/[0.04]")
              }
            >
              <span className={"h-1.5 w-1.5 rounded-full " + (w.min ? "bg-faint" : "bg-accent")} />
              {w.bar}
            </button>
          );
        })}
      </div>

      <NotificationCenter onOpenChangelog={onOpenChangelog} />
      <LangSwitch locale={locale} onSwitch={onSwitchLocale} />
    </header>
  );
}
