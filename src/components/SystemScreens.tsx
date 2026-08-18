import { useEffect, useState } from "react";
import { useSiteConfig } from "../lib/siteConfig";
import { useChrome } from "../lib/useChrome";

export type Power = "on" | "off" | "locked";
export type Phase = null | "shutdown" | "boot" | "wipe";

const OVERLAY = "fixed inset-0 z-[200] grid place-items-center bg-ink text-center";

function Spinner() {
  return <span className="spin inline-block h-5 w-5 rounded-full border-2 border-white/20 border-t-accent" />;
}

function Shutdown() {
  const { productName = "ToOS" } = useSiteConfig();
  const c = useChrome();
  return (
    <div className={OVERLAY}>
      <div className="flex flex-col items-center gap-4 font-mono text-sm text-muted">
        <Spinner />
        <p>{productName} — {c.shuttingDown}</p>
      </div>
    </div>
  );
}

function Boot() {
  const { productName = "ToOS", user, version } = useSiteConfig();
  const lines = [
    `${productName} ${version} — booting`,
    `[ ok ] mount /home/${user}`,
    "[ ok ] start window-manager",
    "[ ok ] load workspace",
    "[ ok ] init shell",
    `welcome, ${user} ✦`,
  ];
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= lines.length) return;
    const t = setTimeout(() => setN((v) => v + 1), 240);
    return () => clearTimeout(t);
  }, [n, lines.length]);
  return (
    <div className={OVERLAY}>
      <div className="w-[min(90vw,460px)] text-left font-mono text-[13px]">
        <div className="brand-toos mb-4 font-display text-2xl font-bold tracking-tight">{productName}</div>
        {lines.slice(0, n).map((l, i) => (
          <div key={i} className={l.startsWith("[ ok ]") ? "text-faint" : "text-paper"}>
            {l.replace("[ ok ]", "")}
            {l.startsWith("[ ok ]") && <span className="text-green"> ok</span>}
          </div>
        ))}
        <div className="mt-4 h-1 w-full overflow-hidden rounded bg-white/10">
          <div className="progress-fill loadbar h-full rounded bg-accent" style={{ width: 0 }} />
        </div>
      </div>
    </div>
  );
}

const JUNK = [
  "/bin", "/boot/vmlinuz", "/etc/passwd", "/home/user/.ssh", "/lib/systemd", "/usr/bin/node",
  "/var/log/syslog", "/opt/toos", "/root/.bashrc", "/srv/www", "/proc/cpuinfo", "/dev/sda1",
  "/usr/lib/portfolio.so", "/home/user/projects", "/etc/hostname", "/sbin/init",
];

function Wipe() {
  const c = useChrome();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => v + 1), 90);
    return () => clearInterval(id);
  }, []);
  const shown = Array.from({ length: Math.min(i, 14) }, (_, k) => JUNK[(i - 14 + k + JUNK.length * 4) % JUNK.length]);
  return (
    <div className="fixed inset-0 z-[200] overflow-hidden bg-black p-6 font-mono text-[12px]">
      <div className="glitch">
        <p className="text-pink">❯ rm -rf /</p>
        {shown.map((p, k) => (
          <div key={k} className="text-red-400" style={{ color: "#ff5f57" }}>
            rm: removing '{p}' …
          </div>
        ))}
        <p className="mt-2 text-amber" style={{ color: "#febc2e" }}>
          {c.kernelPanic} <span className="caret" />
        </p>
      </div>
    </div>
  );
}

function Off({ onPowerOn }: { onPowerOn: () => void }) {
  const { productName = "ToOS" } = useSiteConfig();
  const c = useChrome();
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black">
      <div className="flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={onPowerOn}
          aria-label="Power on"
          className="powerpulse grid h-16 w-16 place-items-center rounded-full border border-accent/60 text-2xl text-accent transition-transform hover:scale-105"
        >
          ⏻
        </button>
        <p className="font-mono text-xs text-faint">{productName} — {c.pressPowerToBoot}</p>
      </div>
    </div>
  );
}

function Lock({ onUnlock }: { onUnlock: () => void }) {
  const { brand } = useSiteConfig();
  const c = useChrome();
  useEffect(() => {
    const on = () => onUnlock();
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [onUnlock]);
  return (
    <button
      type="button"
      onClick={onUnlock}
      className="fixed inset-0 z-[200] grid w-full place-items-center bg-ink/80 backdrop-blur-xl"
      aria-label="Unlock"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-line text-2xl text-accent">⌂</span>
        <p className="font-display text-lg font-bold">{brand}</p>
        <p className="font-mono text-xs text-faint">{c.unlockHint}</p>
      </div>
    </button>
  );
}

export default function SystemScreens({
  power,
  phase,
  onPowerOn,
  onUnlock,
}: {
  power: Power;
  phase: Phase;
  onPowerOn: () => void;
  onUnlock: () => void;
}) {
  if (phase === "shutdown") return <Shutdown />;
  if (phase === "wipe") return <Wipe />;
  if (phase === "boot") return <Boot />;
  if (power === "off") return <Off onPowerOn={onPowerOn} />;
  if (power === "locked") return <Lock onUnlock={onUnlock} />;
  return null;
}
