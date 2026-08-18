import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { useSys } from "../lib/sysCtx";
import { useFs } from "../lib/fsCtx";

export type MenuLeaf = { id: string; label: string; color?: string; protected?: boolean };
export type MenuFolder = { id: string; label: string; color?: string; folder: true; items: MenuItem[] };
export type MenuItem = MenuLeaf | { divider: true } | MenuFolder;

/** Recursively flattens folders into their openable leaf items — for
 *  callers (e.g. the terminal's ls/cat/open/rm) that only care about real,
 *  openable ids and don't need the ~/menu grouping structure. */
export function flattenMenuItems(items: MenuItem[]): MenuLeaf[] {
  return items.flatMap((it) => {
    if ("divider" in it) return [];
    if ("folder" in it) return flattenMenuItems(it.items);
    return [it];
  });
}

function Cmd({ color, deleted, onClick, children }: { color?: string; deleted?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-[13px] transition-colors hover:bg-white/[0.04]"
    >
      <span className={deleted ? "text-faint" : "text-accent"}>❯</span>
      <span className="text-muted group-hover:text-paper">open</span>
      <span className={deleted ? "text-faint line-through" : (color ?? "text-paper")}>{children}</span>
      {deleted && <span className="ml-auto text-[10px] text-pink">rm'd</span>}
    </button>
  );
}

function Folder({ color, open, onToggle, children }: { color?: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-[13px] transition-colors hover:bg-white/[0.04]"
    >
      <span className="text-accent">{open ? "▾" : "▸"}</span>
      <span className="text-muted group-hover:text-paper">cd</span>
      <span className={color ?? "text-paper"}>{children}/</span>
    </button>
  );
}

/** The taskbar's "start menu": a flat, consumer-supplied list of openable
 *  items (pages, terminal, settings, ...) plus generic power actions. */
export default function CommandMenu({
  desktop,
  pos,
  items,
  onOpen,
  onMove,
  onClose,
}: {
  desktop: boolean;
  pos: { x: number; y: number };
  items: MenuItem[];
  onOpen: (id: string) => void;
  onMove: (x: number, y: number) => void;
  onClose: () => void;
}) {
  const sys = useSys();
  const { deleted } = useFs();
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ ox: number; oy: number } | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggle = (id: string) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  const renderItems = (list: MenuItem[], depth: number): React.ReactNode =>
    list.map((it, i) => {
      if ("divider" in it) return <div key={`divider-${depth}-${i}`} className="my-2 border-t border-line" />;
      if ("folder" in it) {
        const open = expanded.includes(it.id);
        return (
          <div key={it.id}>
            <Folder color={it.color} open={open} onToggle={() => toggle(it.id)}>
              {it.label}
            </Folder>
            {open && <div className="ml-4 border-l border-line pl-2">{renderItems(it.items, depth + 1)}</div>}
          </div>
        );
      }
      return (
        <Cmd key={it.id} color={it.color} deleted={deleted.includes(it.id)} onClick={() => onOpen(it.id)}>
          {it.label}
        </Cmd>
      );
    });

  const onDown = (e: RPointerEvent) => {
    if (!desktop) return;
    drag.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMoveH = (e: RPointerEvent) => {
    if (!drag.current) return;
    const wdt = boxRef.current?.getBoundingClientRect().width ?? 0;
    const GRAB = 120; // keep this much of the header reachable
    const HEADER = 44;
    const nx = Math.max(GRAB - wdt, Math.min(e.clientX - drag.current.ox, window.innerWidth - GRAB));
    const ny = Math.max(52, Math.min(e.clientY - drag.current.oy, window.innerHeight - HEADER));
    onMove(nx, ny);
  };
  const onUp = () => {
    drag.current = null;
  };

  const style = desktop
    ? ({ position: "fixed", left: pos.x, top: pos.y, zIndex: 95, width: "15rem" } as const)
    : ({ position: "fixed", left: "1rem", right: "1rem", top: "3.5rem", zIndex: 95, width: "auto" } as const);

  const sysBtn = "flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line py-1.5 font-mono text-[11px] text-muted transition-colors hover:text-paper";

  return (
    <div ref={boxRef} className="overflow-hidden rounded-2xl border border-line bg-ink-2/85 shadow-2xl shadow-black/60 backdrop-blur-md" style={style}>
      <div
        onPointerDown={onDown}
        onPointerMove={onMoveH}
        onPointerUp={onUp}
        className={"flex touch-none select-none items-center gap-2 border-b border-line px-4 py-2.5 " + (desktop ? "cursor-grab active:cursor-grabbing" : "")}
      >
        <button type="button" onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="Close" className="group h-3 w-3 rounded-full bg-[#ff5f57]">
          <span className="grid h-full w-full place-items-center text-[7px] leading-none text-black/60 opacity-0 group-hover:opacity-100">✕</span>
        </button>
        <span className="h-3 w-3 rounded-full bg-white/12" title="disabled" aria-disabled />
        <span className="h-3 w-3 rounded-full bg-white/12" title="disabled" aria-disabled />
        <span className="ml-1 font-mono text-xs text-faint">~/menu</span>
      </div>

      <div className="p-3">
        {renderItems(items, 0)}

        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => sys("shutdown")} className={sysBtn} title="shutdown">
            ⏻ <span>off</span>
          </button>
          <button type="button" onClick={() => sys("reboot")} className={sysBtn} title="restart">
            ⟳ <span>reboot</span>
          </button>
          <button type="button" onClick={() => sys("lock")} className={sysBtn} title="lock">
            ⌂ <span>lock</span>
          </button>
        </div>
      </div>
    </div>
  );
}
