import { useEffect, useRef, useState } from "react";
import { useSys } from "../lib/sysCtx";
import { useTheme } from "../lib/themeCtx";
import { useLocale, useSwitchLocale } from "../lib/localeCtx";
import { useKlingon } from "../lib/klingonCtx";
import { useSiteConfig } from "../lib/siteConfig";
import { useWins } from "../lib/winsCtx";
import { useChrome } from "../lib/useChrome";
import { useOpen } from "../lib/openCtx";
import { useFs } from "../lib/fsCtx";
import { useBootTime } from "../lib/bootCtx";
import { motdLines } from "../lib/motd";
import { useWindowClose } from "../lib/windowCtx";
import type { CommandRegistry, LinkItem } from "../terminal/types";
import { joinPath, listDir } from "../terminal/fs";
import { flattenMenuItems, type MenuItem } from "./CommandMenu";

type Line = { t: string; c?: string };

export default function Terminal({ commands, items = [], links = [] }: { commands: CommandRegistry; items?: MenuItem[]; links?: LinkItem[] }) {
  const sys = useSys();
  const theme = useTheme();
  const locale = useLocale();
  const switchLocale = useSwitchLocale();
  const klingon = useKlingon();
  const siteConfig = useSiteConfig();
  const wins = useWins();
  const chrome = useChrome();
  const open = useOpen();
  const { deleted, remove } = useFs();
  const bootTime = useBootTime();
  const closeWindow = useWindowClose();
  const flatItems = flattenMenuItems(items);

  const historyKey = `toos-${siteConfig.host}-shell-history`;
  const [log, setLog] = useState<Line[]>(() => [
    { t: `${siteConfig.productName ?? "ToOS"} shell — ${chrome.terminal.helpHint}`, c: "text-faint" },
    ...motdLines(siteConfig.motd, chrome.terminal.motd).map((t) => ({ t, c: "text-muted" })),
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("");
  const [elevated, setElevated] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof localStorage === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(historyKey) || "[]"); } catch { return []; }
  });
  const [histPos, setHistPos] = useState<number | null>(null);
  const [rs, setRs] = useState<{ term: string; from: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [log]);

  const push = (t: string, c?: string) => setLog((l) => [...l, { t, c }]);

  const record = (cmd: string) =>
    setHistory((h) => {
      if (!cmd.trim() || cmd === h[h.length - 1]) return h;
      const nh = [...h, cmd].slice(-100);
      try { localStorage.setItem(historyKey, JSON.stringify(nh)); } catch { /* ignore */ }
      return nh;
    });
  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(historyKey); } catch { /* ignore */ }
  };
  const recall = (dir: number) => {
    if (!history.length) return;
    let pos = histPos === null ? history.length : histPos;
    pos += dir;
    if (pos < 0) pos = 0;
    if (pos >= history.length) { setHistPos(null); setInput(""); return; }
    setHistPos(pos);
    setInput(history[pos]);
  };
  const rsFind = (term: string, from: number) => {
    if (!term) return null;
    for (let i = Math.min(from, history.length - 1); i >= 0; i--) {
      if (history[i].includes(term)) return { cmd: history[i], idx: i };
    }
    return null;
  };

  const promptUser = elevated ? "root" : siteConfig.user;

  const run = (raw: string) => {
    const cmd = raw.trim();
    push(`${promptUser}@${siteConfig.host}:~${cwd ? "/" + cwd : ""}${elevated ? "#" : "$"} ${cmd}`, "text-paper");
    if (!cmd) return;
    record(cmd);
    let parts = cmd.split(/\s+/);
    let sudo = elevated;
    let sudoPrefixed = false;
    if (parts[0] === "sudo") {
      sudo = true;
      sudoPrefixed = true;
      parts = parts.slice(1);
    }
    if (parts[0] === "su") {
      if (!sudoPrefixed && !elevated) { push(`su: ${chrome.terminal.permissionDenied}`, "text-pink"); return; }
      setElevated(true);
      push(chrome.terminal.suGranted("root", siteConfig.host), "text-amber");
      return;
    }
    if (parts[0] === "exit") {
      if (elevated) { setElevated(false); push(chrome.terminal.suDropped, "text-faint"); return; }
      closeWindow();
      return;
    }
    // `config theme dark` / `config pride on` / ... groups onto the sub-command.
    if (parts[0] === "config" && parts.length > 1 && parts[1] !== "--help" && parts[1] !== "-h") {
      parts = parts.slice(1);
    }
    const [name, ...args] = parts;
    if (!name) {
      push(chrome.terminal.usageSudo, "text-faint");
      return;
    }
    const arg = (args.find((a) => !a.startsWith("-")) || "").replace(/^\.?\//, "").replace(/\/$/, "");
    // `arg` resolved against `cwd` — what `cat`/`open`/`rm` match against.
    // `cd` handles ".."/"~" itself rather than joining them onto `cwd`.
    const path = joinPath(cwd, arg);

    const hrCmd = ["ls", "df", "du", "free"].includes(name);
    const command = commands[name];
    if (name !== "help" && (args.includes("--help") || (!hrCmd && args.includes("-h")))) {
      if (command?.usage) command.usage.forEach((l) => push(l, "text-muted"));
      else push(`${name}: no help available — try 'help'`, "text-pink");
      return;
    }

    if (name === "help") {
      const rows = Object.entries(commands).map(([n, c]) => [n, c.usage?.[0]?.split(" — ")[1] ?? ""] as [string, string]);
      push(chrome.terminal.availableCommands, "text-muted");
      rows.forEach(([n, d]) => push(`  ${n.padEnd(16)}${d}`, "text-muted"));
      push(chrome.terminal.runHelp, "text-faint");
      return;
    }

    if (!command) {
      push(`${name}: ${chrome.terminal.unknownCommand} — try 'help'`, "text-pink");
      return;
    }
    command.run({
      args, arg, path, sudo, elevated, setElevated, cwd, setCwd, locale, switchLocale, push, sys, theme, klingon, siteConfig, wins, chrome,
      history, clearHistory, clearLog: () => setLog([]),
      items: flatItems, menu: items, open, deleted, remove, bootTime, links,
    });
  };

  // commands whose (single, non-flag) argument names an item/link
  const ARG_AWARE = new Set(["open", "cat", "rm", "cd"]);

  const complete = () => {
    const parts = input.split(/\s+/);
    const cmdMode = parts.length <= 1;
    const last = parts[parts.length - 1] ?? "";
    const bare = last.replace(/^\.?\//, "");
    const cmdName = parts[0]?.replace(/^sudo$/, "") === "sudo" ? parts[1] : parts[0];

    if (cmdMode) {
      const matches = Object.keys(commands).filter((c) => c.startsWith(last));
      applyCompletion(parts, last, matches);
      return;
    }
    if (!ARG_AWARE.has(cmdName)) return;

    // split "docs/gui" into the directory part ("docs") and the leaf
    // prefix being completed ("gui") — resolved against `cwd` so nested
    // paths tab-complete too, not just the current directory.
    const slash = bare.lastIndexOf("/");
    const dirArg = slash === -1 ? "" : bare.slice(0, slash);
    const leafPrefix = slash === -1 ? bare : bare.slice(slash + 1);
    const dirPath = joinPath(cwd, dirArg);
    const dir = listDir(items, links, dirPath);
    if (!dir) return;
    const pool = dir.kind === "links"
      ? [...(dirPath ? [".."] : []), ...dir.links.filter((l) => !l.protected || theme.mature).map((l) => l.name)]
      : [
          ...(dirPath ? [".."] : []),
          ...dir.folders.map((f) => `${f.id}/`),
          ...(dir.showLinksEntry ? ["links/"] : []),
          ...dir.leaves.filter((it) => !deleted.includes(it.id)).map((it) => it.id),
        ];
    if (!pool.length) return;
    const matches = pool.filter((c) => c.startsWith(leafPrefix));
    const prefix = dirArg ? `${dirArg}/` : "";
    applyCompletion(parts, last, matches.map((m) => prefix + m));
  };

  const applyCompletion = (parts: string[], last: string, matches: string[]) => {
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      setInput(parts.join(" "));
    } else if (matches.length > 1) {
      const cp = matches.reduce((a, b) => {
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        return a.slice(0, i);
      });
      if (cp.length > last.length) {
        parts[parts.length - 1] = cp;
        setInput(parts.join(" "));
      }
      push(matches.join("   "), "text-faint");
    }
  };

  return (
    <div className="font-mono text-[13px]" onClick={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus(); }}>
      <div className="max-h-[46vh] space-y-0.5 overflow-y-auto no-scrollbar">
        {log.map((l, i) => (
          <div key={i} className={"whitespace-pre-wrap break-words " + (l.c ?? "text-muted")}>
            {l.t}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {rs && (
        <div className="mt-2 font-mono text-[13px] text-faint">
          (reverse-i-search)`{rs.term}`: <span className="text-paper">{rsFind(rs.term, rs.from)?.cmd ?? ""}</span>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
          setInput("");
          setHistPos(null);
          setRs(null);
        }}
        className="mt-2 flex items-center gap-2"
      >
        {rs ? (
          <span className="shrink-0 select-none text-cyan">⌕</span>
        ) : (
          <span className="shrink-0 select-none whitespace-nowrap">
            <span className="text-green">{promptUser}@{siteConfig.host}</span>
            <span className="text-muted">:</span>
            <span className="text-cyan">~{cwd ? "/" + cwd : ""}</span>
            <span className={elevated ? "text-pink" : "text-muted"}>{elevated ? "#" : "$"}</span>
          </span>
        )}
        <input
          ref={inputRef}
          value={rs ? rs.term : input}
          onChange={(e) => {
            if (rs) setRs({ term: e.target.value, from: history.length });
            else { setInput(e.target.value); setHistPos(null); }
          }}
          onKeyDown={(e) => {
            if (rs) {
              const m = rsFind(rs.term, rs.from);
              if (e.key === "Enter") { e.preventDefault(); setRs(null); const cmd = m?.cmd ?? rs.term; setInput(""); setHistPos(null); if (cmd.trim()) run(cmd); return; }
              if (e.key === "Escape" || (e.ctrlKey && e.key.toLowerCase() === "g")) { e.preventDefault(); setInput(m?.cmd ?? ""); setRs(null); return; }
              if (e.altKey && e.key.toLowerCase() === "r") { e.preventDefault(); const older = rsFind(rs.term, (m?.idx ?? history.length) - 1); if (older) setRs({ term: rs.term, from: older.idx }); return; }
              if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); setInput(m?.cmd ?? ""); setRs(null); return; }
              return;
            }
            if (e.altKey && e.key.toLowerCase() === "r") { e.preventDefault(); setRs({ term: "", from: history.length }); return; }
            if (e.key === "Tab") { e.preventDefault(); complete(); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); recall(-1); return; }
            if (e.key === "ArrowDown") { e.preventDefault(); recall(1); return; }
          }}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent text-paper caret-accent outline-none"
          aria-label="terminal input"
        />
      </form>
    </div>
  );
}
