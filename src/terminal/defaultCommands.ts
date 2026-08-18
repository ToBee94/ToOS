import type { Command, CommandRegistry, CommandCtx } from "./types";
import { ACCENTS } from "../lib/themeCtx";
import { formatUptime } from "../lib/bootCtx";
import { motdLines } from "../lib/motd";
import { collectFolderIds, joinPath, listDir, resolveFolder, resolvePath } from "./fs";
import { flattenMenuItems } from "../components/CommandMenu";

const perm = (c: string) => (ctx: CommandCtx) => ctx.push(`${c}: ${ctx.chrome.terminal.permissionDenied}`, "text-pink");

export const DEFAULT_COMMANDS: CommandRegistry = {
  help: {
    usage: ["help — list all available commands", "usage: help"],
    run: ({ push, chrome }) => {
      push(chrome.terminal.availableCommands, "text-muted");
      push(chrome.terminal.runHelp, "text-faint");
    },
  },
  motd: {
    usage: ["motd — show the message of the day", "usage: motd"],
    run: ({ push, siteConfig, chrome }) => motdLines(siteConfig.motd, chrome.terminal.motd).forEach((l) => push(l, "text-muted")),
  },
  whoami: {
    usage: ["whoami — print the current user", "usage: whoami"],
    run: ({ push, siteConfig }) => push(siteConfig.whoami, "text-green"),
  },
  pwd: {
    usage: ["pwd — print the working directory", "usage: pwd"],
    run: ({ push, cwd, siteConfig, elevated }) => {
      const home = elevated ? "/root" : `/home/${siteConfig.user}`;
      push(cwd ? `${home}/${cwd}` : home, "text-muted");
    },
  },
  hostname: {
    usage: ["hostname — the machine name", "usage: hostname"],
    run: ({ push, siteConfig }) => push(siteConfig.domain, "text-muted"),
  },
  date: {
    usage: ["date — current date & time", "usage: date"],
    run: ({ push }) => push(new Date().toString(), "text-muted"),
  },
  time: {
    usage: ["time — current time", "usage: time"],
    run: ({ push, locale }) => push(new Date().toLocaleTimeString(locale, { hour12: false }), "text-muted"),
  },
  uptime: {
    usage: ["uptime — how long the system has been up + load average", "usage: uptime"],
    run: ({ push, locale, bootTime }) => {
      const clock = new Date().toLocaleTimeString(locale, { hour12: false });
      push(`${clock} up ${formatUptime(Date.now() - bootTime)},  1 user,  load average: 0.42, 0.37, 0.31`, "text-muted");
    },
  },
  load: {
    usage: ["load — system load average (1m · 5m · 15m)", "usage: load"],
    run: ({ push, chrome }) => push(`load average: 0.42, 0.37, 0.31   — ${chrome.terminal.loadAverage}`, "text-muted"),
  },
  clear: {
    usage: ["clear — clear the screen", "usage: clear"],
    run: ({ clearLog }) => clearLog(),
  },
  history: {
    usage: ["history — show command history (↑/↓ to walk, alt+r to search)", "usage: history [-c]"],
    run: ({ args, push, history, clearHistory, chrome }) => {
      if (args.includes("-c")) {
        clearHistory();
        push(chrome.terminal.historyCleared, "text-faint");
        return;
      }
      if (!history.length) push(chrome.terminal.noHistory, "text-faint");
      else history.forEach((h, i) => push(`${String(i + 1).padStart(3)}  ${h}`, "text-muted"));
    },
  },
  top: {
    usage: ["top — running processes & load", "usage: top"],
    run: ({ push, locale, wins, bootTime }) => {
      const clock = new Date().toLocaleTimeString(locale, { hour12: false });
      const openCount = wins.filter((w) => !w.min).length;
      [
        `top - ${clock} up ${formatUptime(Date.now() - bootTime)},  1 user,  load average: 0.42, 0.37, 0.31`,
        `Tasks: ${wins.length + 4} total,   ${openCount + 1} running, ${wins.length + 3 - openCount} sleeping,   0 stopped`,
        "%Cpu(s):  4.2 us,  1.1 sy,  0.0 ni, 94.3 id,  0.4 wa",
        "MiB Mem :  16000.0 total,   8200.4 free,   4200.1 used,   3599.5 buff/cache",
        "",
        "  PID USER      %CPU %MEM    TIME+ COMMAND",
      ].forEach((r) => push(r, "text-faint"));
      const proc = (pid: string, cpu: string, mem: string, time: string, cmd: string, c = "text-muted") =>
        push(`${pid.padStart(5)} user      ${cpu.padStart(4)} ${mem.padStart(4)}  ${time} ${cmd}`, c);
      proc("1", "0.0", "0.1", "0:04.20", "window-manager");
      proc("42", "2.1", "1.4", "1:12.03", "render");
      wins.forEach((w, i) => proc(String(2000 + i), w.min ? "0.1" : (2.4 + (i % 4) * 0.7).toFixed(1), (0.8 + (i % 5) * 0.4).toFixed(1), "0:00.42", `win:${w.id}${w.min ? " (sleeping)" : ""}`, w.min ? "text-faint" : "text-cyan"));
    },
  },
  df: {
    usage: ["df — disk space per filesystem", "usage: df [-h]"],
    run: ({ push, args }) => {
      const h = args.some((a) => a.startsWith("-") && a.includes("h"));
      push(`Filesystem      ${h ? "Size  Used Avail" : "1K-blocks      Used   Avail"} Use% Mounted on`, "text-faint");
      (h
        ? [["/dev/sda1", "200G", "88G", "112G", "44%", "/"], ["tmpfs", "7.8G", "1.2M", "7.8G", "1%", "/dev/shm"]]
        : [["/dev/sda1", "209715200", "92274688", "117440512", "44%", "/"], ["tmpfs", "8176000", "1200", "8174800", "1%", "/dev/shm"]]
      ).forEach(([fs, size, used, avail, pct, mnt]) => push(`${fs.padEnd(15)} ${String(size).padStart(h ? 4 : 10)} ${String(used).padStart(h ? 5 : 9)} ${String(avail).padStart(h ? 5 : 9)} ${pct.padStart(4)} ${mnt}`, "text-muted"));
    },
  },
  free: {
    usage: ["free — memory usage", "usage: free [-h]"],
    run: ({ push, args }) => {
      const h = args.some((a) => a.startsWith("-") && a.includes("h"));
      push("              total        used        free      shared  buff/cache   available", "text-faint");
      if (h) {
        push("Mem:           16Gi       4.1Gi       8.0Gi       120Mi       3.9Gi        11Gi", "text-muted");
        push("Swap:         2.0Gi          0B       2.0Gi", "text-muted");
      } else {
        push("Mem:       16384000     4300288     8388608      122880     4096000    11534336", "text-muted");
        push("Swap:       2097152           0     2097152", "text-muted");
      }
    },
  },
  version: {
    usage: ["version — print version & build", "usage: version"],
    run: ({ push, siteConfig, chrome }) => push(chrome.terminal.versionLine(siteConfig.version, siteConfig.build), "text-muted"),
  },
  config: {
    usage: ["config — preferences: theme, accent, pride, language", "usage: config <theme|accent|pride|language> [value]", "run 'config <sub> --help' for details"],
    run: ({ push, theme, klingon, locale }) => {
      push("config — current settings:", "text-muted");
      push(`  theme     ${theme.pref}`, "text-muted");
      push(`  accent    ${theme.accent || ACCENTS[0].key}`, "text-muted");
      push(`  pride     ${theme.pride ? "on" : "off"}`, "text-muted");
      push(`  language  ${klingon.on ? "klingon" : locale}`, "text-muted");
      push("usage: config <theme|accent|pride|language> [value]", "text-faint");
    },
  },
  theme: {
    usage: ["theme — set the colour theme", "usage: theme [system|light|dark]"],
    run: ({ push, arg, theme, chrome }) => {
      if (arg === "system" || arg === "light" || arg === "dark") {
        theme.setPref(arg);
        push(chrome.terminal.themeChanged(arg), "text-accent");
      } else push("usage: theme [system|light|dark]", "text-faint");
    },
  },
  accent: {
    usage: ["accent — set the primary colour", `usage: accent [${ACCENTS.map((a) => a.key).join("|")}]`],
    run: ({ push, arg, theme, chrome }) => {
      const keys = ACCENTS.map((a) => a.key);
      if (keys.includes(arg)) {
        theme.setAccent(arg);
        push(chrome.terminal.accentChanged(arg), "text-accent");
      } else push(`usage: accent [${keys.join("|")}]`, "text-faint");
    },
  },
  pride: {
    usage: ["pride — toggle the pride skin", "usage: pride [on|off]"],
    run: ({ arg, theme, push, chrome }) => {
      const on = arg !== "off";
      theme.setPride(on);
      push(chrome.terminal.prideChanged(on), "text-accent");
    },
  },
  language: {
    usage: ["language — switch language", "usage: config language [<locale>|klingon]"],
    run: ({ push, arg, klingon, switchLocale, chrome }) => {
      if (arg === "klingon" || arg === "tlh" || arg === "kli") {
        klingon.set(true);
        push("tlhIngan Hol Daghaj — Qapla'!", "text-accent");
        return;
      }
      if (!arg) { push(`usage: config language [<locale>|klingon]`, "text-faint"); return; }
      klingon.set(false);
      push(chrome.terminal.switchingTo(arg), "text-accent");
      switchLocale(arg);
    },
  },
  lang: { usage: ["alias for `language`"], run: (ctx) => DEFAULT_COMMANDS.language.run(ctx) },
  lock: {
    usage: ["lock — lock the screen", "usage: lock"],
    run: ({ sys }) => sys("lock"),
  },
  reboot: {
    usage: ["reboot — restart (reinstalls everything)", "usage: sudo reboot"],
    run: (ctx) => {
      if (!ctx.sudo) return perm("reboot")(ctx);
      ctx.push(ctx.chrome.terminal.rebooting, "text-accent");
      ctx.sys("reboot");
    },
  },
  shutdown: {
    usage: ["shutdown — power off", "usage: sudo shutdown"],
    run: (ctx) => {
      if (!ctx.sudo) return perm("shutdown")(ctx);
      ctx.push(ctx.chrome.terminal.shuttingDownCmd, "text-accent");
      ctx.sys("shutdown");
    },
  },
  reset: {
    usage: ["reset — forget all settings, wipe & reboot into a clean state", "usage: sudo reset"],
    run: (ctx) => {
      if (!ctx.sudo) return perm("reset")(ctx);
      ctx.push(ctx.chrome.terminal.resetting, "text-accent");
      ctx.sys("reset");
    },
  },
  sudo: {
    usage: ["sudo — run a command as root", "usage: sudo <command>"],
    run: ({ push, chrome }) => push(chrome.terminal.usageSudo, "text-faint"),
  },
  // `su`/`exit` are intercepted by the Terminal component itself before
  // dispatch (they toggle persistent elevation, not a one-shot command) —
  // these entries exist only so `help`/tab-complete/`--help` know about them.
  su: {
    usage: ["su — become root for the rest of this session", "usage: su", "type 'exit' to drop back"],
    run: () => {},
  },
  exit: {
    usage: ["exit — drop back to the user shell if `su`'d, otherwise close the shell window", "usage: exit"],
    run: () => {},
  },

  // ── module-registry + ~/links commands — operate on the `menu`/`links`
  // lists passed to <Terminal items={menuItems} links={...}>. Folders in
  // `menu` are real directories: `cd` walks into them, `ls` lists their
  // children, and `cat`/`open`/`rm` resolve paths through them via
  // `resolvePath`/`listDir` (see `./fs`). ──
  ls: {
    usage: ["ls — list the current directory", "usage: ls [-la] [-h] [path]", "tip: 'cd' into a folder or 'links', then 'ls'"],
    run: ({ push, args, arg, cwd, menu, links, deleted, sudo, theme, chrome }) => {
      const flags = args.filter((a) => a.startsWith("-")).join("");
      const long = flags.includes("l") || flags.includes("a");
      const all = flags.includes("a");
      const h = flags.includes("h");
      const own = (root: boolean) => `${(root ? "root" : "user").padEnd(6)} ${(root ? "root" : "user").padEnd(6)}`;
      const dot = (p: string, n: string) => push(`${p}  ${p[0] === "d" ? "2" : "1"} user   user   ${(h ? "4.0K" : "4096").padStart(6)} Jan  1 00:00 ${n}`, "text-muted");

      const target = arg ? joinPath(cwd, arg) : cwd;
      const dir = listDir(menu, links, target);
      if (!dir) { push(`ls: ${arg || target || "."}: ${chrome.terminal.notFound}`, "text-pink"); return; }

      if (dir.kind === "links") {
        const visible = dir.links.filter((l) => !l.protected || sudo || theme.mature);
        if (!long) {
          if (!visible.length) { push(chrome.terminal.noItems, "text-faint"); return; }
          push(visible.map((l) => l.name).join("   "), "text-cyan");
          return;
        }
        push(`total ${h ? "4.0K" : String(visible.length * 4)}`, "text-faint");
        if (all) { dot("drwxr-xr-x", "."); dot("drwxr-xr-x", ".."); }
        if (!visible.length) { push(chrome.terminal.empty, "text-faint"); return; }
        visible.forEach((l) => {
          const perm = l.protected ? "-rw-r-----" : "-rw-r--r--";
          push(`${perm}  1 ${own(!!l.protected)} ${(h ? "0.5K" : "512").padStart(6)} Jan  1 00:00 ${l.name}`, l.protected ? "text-amber" : "text-cyan");
        });
        return;
      }

      const visibleFolders = dir.folders.filter((f) => !deleted.includes(f.id));
      const visible = dir.leaves.filter((it) => !deleted.includes(it.id));
      if (!long) {
        const names = [...visibleFolders.map((f) => `${f.id}/`), ...visible.map((it) => it.id)];
        if (dir.showLinksEntry) names.push("links/");
        if (!names.length) { push(chrome.terminal.noItems, "text-faint"); return; }
        push(names.join("   "), "text-cyan");
        return;
      }
      const total = visibleFolders.length + visible.length + (dir.showLinksEntry ? 1 : 0);
      push(`total ${h ? "4.0K" : String(total * 4)}`, "text-faint");
      if (all) { dot("drwxr-xr-x", "."); dot("drwxr-xr-x", ".."); }
      visibleFolders.forEach((f) => push(`drwxr-xr-x  2 ${own(false)} ${(h ? "4.0K" : "4096").padStart(6)} Jan  1 00:00 ${f.id}`, "text-cyan"));
      if (dir.showLinksEntry) push(`drwxr-xr-x  2 ${own(false)} ${(h ? "4.0K" : "4096").padStart(6)} Jan  1 00:00 links`, "text-cyan");
      visible.forEach((it) => {
        const perm = it.protected ? "-rw-r-----" : "-rw-r--r--";
        push(`${perm}  1 ${own(!!it.protected)} ${(h ? "1.2K" : "1024").padStart(6)} Jan  1 00:00 ${it.id}`, it.protected ? "text-amber" : "text-cyan");
      });
    },
  },
  cat: {
    usage: ["cat — print a module's id, or a link's URL", "usage: cat <id>", "example: cat docs/guide, cat links/github"],
    run: ({ push, path, menu, links, sudo, theme, chrome }) => {
      const resolved = resolvePath(menu, links, path);
      if (resolved.kind === "notfound") { push(`cat: ${path || "?"}: ${chrome.terminal.notFound}`, "text-pink"); return; }
      if (resolved.kind === "dir") { push(`cat: ${path}: ${chrome.terminal.isDirectory}`, "text-pink"); return; }
      if (resolved.kind === "link") {
        const link = resolved.link;
        if (link.protected && !sudo && !theme.mature) { push(`cat: ${path}: ${chrome.terminal.permissionDenied}`, "text-pink"); return; }
        push(link.url ?? `${link.label}: ${link.note ?? ""}`, "text-cyan");
        return;
      }
      push(`${path}: ${chrome.terminal.viewHint}`, "text-faint");
    },
  },
  open: {
    usage: ["open — open a module by id, or a link in a new tab", "usage: open <id>", "example: open docs/guide, open links/github"],
    run: ({ push, path, menu, links, open, sudo, theme, chrome }) => {
      const target = path || "start";
      const resolved = resolvePath(menu, links, target);
      if (resolved.kind === "notfound") { push(`open: ${target}: ${chrome.terminal.notFound}`, "text-pink"); return; }
      if (resolved.kind === "dir") { push(`open: ${target}: ${chrome.terminal.isDirectory}`, "text-pink"); return; }
      if (resolved.kind === "link") {
        const link = resolved.link;
        if (link.protected && !sudo && !theme.mature) { push(`open: ${target}: ${chrome.terminal.permissionDenied}`, "text-pink"); return; }
        if (!link.url) { push(`open: ${target}: no link (${link.label}: ${link.note ?? ""})`, "text-faint"); return; }
        push(chrome.terminal.opening(link.url), "text-accent");
        if (typeof window !== "undefined") window.open(link.url, "_blank", "noopener,noreferrer");
        return;
      }
      push(chrome.terminal.opening(resolved.item.id), "text-accent");
      open(resolved.item.id);
    },
  },
  rm: {
    usage: ["rm — remove a module (sudo required for protected ones)", "usage: rm <id|*>", "sudo rm -rf / wipes everything", "rm -rf <folder> removes it and everything inside", "note: ~/links entries are read-only"],
    run: (ctx) => {
      const { push, arg, args, path, cwd, sudo, menu, links, deleted, remove, chrome, sys } = ctx;
      if (args.includes("-rf") && args.includes("/")) {
        if (!sudo) return perm("rm")(ctx);
        sys("wipe"); // 💥 full destruction — only with sudo
        return;
      }
      if (!arg) { push(`rm: ${chrome.terminal.missingOperand}`, "text-pink"); return; }
      if (arg === "*") {
        const dir = listDir(menu, links, cwd);
        const pool = dir?.kind === "menu" ? dir.leaves.filter((it) => !deleted.includes(it.id) && (sudo || !it.protected)).map((it) => it.id) : [];
        if (!pool.length) { push(chrome.terminal.nothingToRemove, "text-faint"); return; }
        remove(pool);
        pool.forEach((id) => push(chrome.terminal.removed(id), "text-pink"));
        return;
      }
      if (args.includes("-rf") || args.includes("-r")) {
        if (path === "links" || path.startsWith("links/")) { push(`rm: ${path}: ${chrome.terminal.readOnly}`, "text-pink"); return; }
        const folder = resolveFolder(menu, path);
        if (!folder) { push(`rm: ${path}: ${chrome.terminal.notFound}`, "text-pink"); return; }
        const allLeaves = flattenMenuItems(folder.items).filter((it) => !deleted.includes(it.id));
        const removable = allLeaves.filter((it) => sudo || !it.protected);
        if (removable.length) {
          remove(removable.map((it) => it.id));
          removable.forEach((it) => push(chrome.terminal.removed(it.id), "text-pink"));
        }
        if (removable.length === allLeaves.length) {
          remove([folder.id, ...collectFolderIds(folder.items)]);
          push(chrome.terminal.removed(path), "text-pink");
        } else {
          push(`rm: ${path}: ${chrome.terminal.permissionDenied}`, "text-pink");
        }
        return;
      }
      const resolved = resolvePath(menu, links, path);
      if (resolved.kind === "notfound") { push(`rm: ${path}: ${chrome.terminal.notFound}`, "text-pink"); return; }
      if (resolved.kind === "dir") { push(`rm: ${path}: ${chrome.terminal.isDirectory}`, "text-pink"); return; }
      if (resolved.kind === "link") { push(`rm: ${path}: ${chrome.terminal.readOnly}`, "text-pink"); return; }
      const found = resolved.item;
      if (found.protected && !sudo) { push(`rm: ${path}: ${chrome.terminal.permissionDenied}`, "text-pink"); return; }
      if (deleted.includes(found.id)) { push(`rm: ${path}: ${chrome.terminal.alreadyRemoved}`, "text-faint"); return; }
      remove([found.id]);
      push(chrome.terminal.removed(found.id), "text-pink");
    },
  },
  cd: {
    usage: ["cd — change directory", "usage: cd [<folder>|links|..|~]", "tip: folders from the ~/menu (and 'links') are real directories here"],
    run: ({ push, arg, cwd, menu, links, deleted, setCwd, chrome }) => {
      if (arg === "" || arg === "~") { setCwd(""); return; }
      if (arg === "..") { setCwd(cwd.split("/").filter(Boolean).slice(0, -1).join("/")); return; }
      const target = joinPath(cwd, arg);
      const segs = target.split("/").filter(Boolean);
      if (segs[0] !== "links" && segs.some((s) => deleted.includes(s))) { push(`cd: ${arg}: ${chrome.terminal.noSuchDirectory}`, "text-pink"); return; }
      const resolved = resolvePath(menu, links, target);
      if (resolved.kind === "dir") { setCwd(segs.join("/")); return; }
      push(`cd: ${arg}: ${chrome.terminal.noSuchDirectory}`, "text-pink");
    },
  },
};

export { perm };
