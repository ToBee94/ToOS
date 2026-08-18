import { useRef, useState, type PointerEvent as RPointerEvent, type CSSProperties } from "react";
import BootSequence from "./BootSequence";
import { useLocale } from "../lib/localeCtx";
import { WindowCtx } from "../lib/windowCtx";
import type { ModuleTab } from "../types";

export default function Window({
  bar,
  title,
  views,
  x,
  y,
  z,
  w,
  h,
  booting,
  error,
  max,
  active,
  desktop,
  onFocus,
  onClose,
  onMinimize,
  onToggleMax,
  onMove,
  onResize,
  onBootDone,
}: {
  bar: string;
  title: string;
  views: ModuleTab[];
  x: number;
  y: number;
  z: number;
  w?: number;
  h?: number;
  booting: boolean;
  error: boolean;
  max: boolean;
  active: boolean;
  desktop: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMax: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onBootDone: () => void;
}) {
  const locale = useLocale();
  const winRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ ox: number; oy: number } | null>(null);
  const rs = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const [tab, setTab] = useState(views[0].key);
  const view = views.find((v) => v.key === tab) ?? views[0];
  const Active = view.C;
  const tabbed = views.length > 1;
  const canDrag = desktop && !max;
  const minW = tabbed ? 780 : 620; // minimum = opening size
  const sized = max || h != null;

  const onHeaderDown = (e: RPointerEvent) => {
    onFocus();
    if (!canDrag) return;
    drag.current = { ox: e.clientX - x, oy: e.clientY - y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHeaderMove = (e: RPointerEvent) => {
    if (!drag.current) return;
    const wdt = winRef.current?.getBoundingClientRect().width ?? 0;
    // allow pushing off-screen, but keep enough of the header reachable to grab it
    const GRAB = 120; // min. visible width
    const HEADER = 44; // header height — keep it below the top bar and above the bottom edge
    const nx = Math.max(GRAB - wdt, Math.min(e.clientX - drag.current.ox, window.innerWidth - GRAB));
    const ny = Math.max(52, Math.min(e.clientY - drag.current.oy, window.innerHeight - HEADER));
    onMove(nx, ny);
  };
  const onHeaderUp = () => {
    drag.current = null;
  };

  const onResizeDown = (e: RPointerEvent) => {
    e.stopPropagation();
    onFocus();
    const r = winRef.current?.getBoundingClientRect();
    if (!r) return;
    rs.current = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: RPointerEvent) => {
    if (!rs.current) return;
    const nw = Math.min(Math.max(rs.current.w + (e.clientX - rs.current.x), minW), window.innerWidth * 0.96);
    const nh = Math.min(Math.max(rs.current.h + (e.clientY - rs.current.y), 240), window.innerHeight - 80);
    onResize(nw, nh);
  };
  const onResizeUp = () => {
    rs.current = null;
  };

  const style: CSSProperties | undefined = desktop
    ? max
      ? { position: "absolute", left: 16, top: 52, width: "calc(100vw - 32px)", height: "calc(100vh - 68px)", zIndex: z }
      : {
          position: "absolute",
          left: x,
          top: y,
          width: w ?? (tabbed ? "min(94vw, 780px)" : "min(92vw, 620px)"),
          height: h ?? undefined,
          zIndex: z,
        }
    : undefined;

  const light = (color: string, label: string, on: () => void, glyph: string) => (
    <button
      type="button"
      onClick={on}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={label}
      className="group grid h-3 w-3 place-items-center rounded-full"
      style={{ background: color }}
    >
      <span className="text-[7px] leading-none text-black/60 opacity-0 group-hover:opacity-100">{glyph}</span>
    </button>
  );

  return (
    <div
      ref={winRef}
      className={
        "pointer-events-auto flex flex-col overflow-hidden rounded-xl border shadow-2xl shadow-black/50 backdrop-blur transition-[opacity,filter,background-color] duration-200 " +
        (active ? "border-line bg-ink-2/90" : "border-line/60 bg-ink-2/50 opacity-80 saturate-[0.6]") +
        (desktop ? "" : " mb-4")
      }
      style={style}
      onPointerDown={onFocus}
    >
      <div
        onPointerDown={onHeaderDown}
        onPointerMove={onHeaderMove}
        onPointerUp={onHeaderUp}
        onDoubleClick={onToggleMax}
        className={"win-header flex shrink-0 touch-none select-none items-center gap-2 border-b border-line px-4 py-2.5 " + (canDrag ? "cursor-grab active:cursor-grabbing" : "")}
      >
        {light("#ff5f57", "Close", onClose, "✕")}
        {light("#febc2e", "Minimize", onMinimize, "−")}
        {light("#28c840", "Maximize", onToggleMax, "+")}
        <span className="ml-1 font-mono text-xs text-faint">{bar}</span>
      </div>

      <div className={"min-h-0 flex-1 overflow-y-auto p-6 sm:p-7 " + (sized ? "" : "max-h-[72vh]")}>
        {error ? (
          <div className="font-mono text-[13px]">
            <div>
              <span className="text-green">❯</span> <span className="text-muted">./open</span> <span className="text-accent">{bar}</span>
            </div>
            <div className="mt-1 text-muted">loading {bar} …</div>
            <div className="mt-2 text-pink">error: ENOENT — no such file or directory</div>
            <div className="text-pink">failed to load module '{bar}'</div>
            <div className="text-pink">segmentation fault (core dumped)</div>
            <div className="mt-3 text-faint">hint: this page was removed — run `sudo reboot` to reinstall</div>
          </div>
        ) : booting ? (
          <BootSequence label={bar} onDone={onBootDone} />
        ) : (
          <>
            {title && <h1 className="mb-6 font-display text-2xl font-bold tracking-tight">{title}</h1>}
            {tabbed ? (
              <div className="flex gap-5">
                <nav className="w-fit max-w-40 shrink-0 border-r border-line pr-3">
                  {views.map((v) => {
                    const on = v.key === tab;
                    return (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setTab(v.key)}
                        className={"flex w-full items-start gap-1.5 rounded-md px-2 py-1.5 text-left font-mono text-[12px] transition-colors " + (on ? "bg-white/[0.06] text-paper" : "text-muted hover:text-paper")}
                      >
                        <span className={"shrink-0 " + (on ? "text-accent" : "text-faint")}>❯</span>
                        <span className="min-w-0 break-words">{locale === "en" ? v.label.en : v.label.de}</span>
                      </button>
                    );
                  })}
                </nav>
                <div className="min-w-0 flex-1">
                  <WindowCtx.Provider value={{ close: onClose }}>
                    <Active />
                  </WindowCtx.Provider>
                </div>
              </div>
            ) : (
              <WindowCtx.Provider value={{ close: onClose }}>
                <Active />
              </WindowCtx.Provider>
            )}
          </>
        )}
      </div>

      {desktop && !max && (
        <div
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          className="absolute bottom-0 right-0 z-10 h-5 w-5 cursor-nwse-resize touch-none"
          aria-hidden
        >
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 h-2 w-2 border-b-2 border-r-2 border-faint" />
        </div>
      )}
    </div>
  );
}
