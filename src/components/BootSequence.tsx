import { useEffect, useState } from "react";
import { useSiteConfig } from "../lib/siteConfig";

// In-window terminal boot: a Powerlevel10k-style zsh prompt where the ./open
// command is typed out, then a staged boot sequence runs step by step before
// the window content reveals. Calls onDone when finished.
type Seg = { bg: string; fg: string; text: string };

const H = "22px";
const ARROW = 11;
const TYPE_MS = 560;
const STEP_MS = 260;
const END_MS = 220;

const STEPS = ["resolve route", "load modules", "mount components", "fetch content", "hydrate state", "render view"];

function Powerline({ segs }: { segs: Seg[] }) {
  return (
    <div className="flex select-none font-mono text-xs leading-none">
      {segs.map((s, i) => {
        const next = segs[i + 1];
        return (
          <div key={i} className="flex items-stretch">
            <span className="flex items-center px-2.5 font-semibold" style={{ background: s.bg, color: s.fg, height: H }}>
              {s.text}
            </span>
            <span
              className="relative inline-block"
              style={{ width: `${ARROW}px`, height: H, background: next ? next.bg : "transparent" }}
            >
              <span
                className="absolute left-0 top-0"
                style={{ width: 0, height: 0, borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderLeft: `${ARROW}px solid ${s.bg}` }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function BootSequence({ label, onDone }: { label: string; onDone: () => void }) {
  const { user } = useSiteConfig();
  const cmd = `./open ${label}`;
  const [typed, setTyped] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    setTyped("");
    setRunning(false);
    setDone(0);
    const step = Math.max(24, Math.floor(TYPE_MS / cmd.length));
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(cmd.slice(0, i));
      if (i >= cmd.length) {
        clearInterval(id);
        setRunning(true);
      }
    }, step);
    return () => clearInterval(id);
  }, [cmd]);

  useEffect(() => {
    if (!running) return;
    if (done >= STEPS.length) {
      const t = setTimeout(onDone, END_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [running, done, onDone]);

  const segs: Seg[] = [
    { bg: "#8957e5", fg: "#ffffff", text: user },
    { bg: "#1f6feb", fg: "#ffffff", text: label },
    { bg: "#2ea043", fg: "#062910", text: "git:main" },
  ];
  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div className="font-mono text-[13px]">
      <Powerline segs={segs} />
      <div className="mt-2 whitespace-pre">
        <span className="text-green">❯</span> <span className="text-paper">{typed}</span>
        {!running && <span className="caret" />}
      </div>

      {running && (
        <>
          <div className="mt-4 space-y-1 text-xs">
            {STEPS.slice(0, Math.min(done + 1, STEPS.length)).map((s, i) => {
              const isDone = i < done;
              return (
                <div key={s} className={isDone ? "text-faint" : "text-muted"}>
                  <span className={isDone ? "text-green" : "text-accent"}>{isDone ? "✓" : "▸"}</span> {s}
                  {isDone ? <span className="text-green"> ok</span> : <span className="dots text-faint" />}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded bg-white/10">
              <div className="progress-fill h-full rounded bg-accent transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-9 text-right font-mono text-[11px] tabular-nums text-faint">{pct}%</span>
          </div>
        </>
      )}
    </div>
  );
}
