import type { SysAction } from "../lib/sysCtx";
import type { WinInfo } from "../lib/winsCtx";
import type { SiteConfig } from "../lib/siteConfig";
import type { ChromeStrings } from "../lib/chrome";
import type { ThemePref } from "../lib/themeCtx";
import type { MenuItem, MenuLeaf } from "../components/CommandMenu";

/** A single entry in the virtual `~/links` folder — external links (profiles,
 *  socials, ...) rather than modules. `protected` entries need `theme.mature`
 *  on or sudo to list/open/cat, same convention as `MenuItem.protected`. */
export type LinkItem = { name: string; label: string; url?: string; note?: string; protected?: boolean };

export type CommandCtx = {
  /** Raw args after the command name (flags included, sudo/config already stripped). */
  args: string[];
  /** First non-flag arg, `./` and trailing `/` stripped. */
  arg: string;
  /** `arg`, resolved against `cwd` — e.g. bare `github` while `cd`'d into
   *  `links` resolves to `links/github`. What `cat`/`open`/`rm` should match
   *  against for path-aware lookups. */
  path: string;
  /** True if this command was prefixed with `sudo`, OR the shell is
   *  currently elevated via `su` (see `elevated`). */
  sudo: boolean;
  /** Persistent elevation toggled by `su`/`exit` — unlike the one-shot
   *  `sudo <cmd>` prefix, `su` elevates every command until `exit`. */
  elevated: boolean;
  setElevated: (v: boolean) => void;
  cwd: string;
  setCwd: (cwd: string) => void;
  locale: string;
  switchLocale: (locale: string) => void;
  push: (text: string, color?: string) => void;
  sys: (a: SysAction) => void;
  theme: {
    pref: ThemePref; setPref: (p: ThemePref) => void;
    accent: string; setAccent: (a: string) => void;
    pride: boolean; setPride: (v: boolean) => void;
    mature: boolean; setMature: (v: boolean) => void;
  };
  klingon: { on: boolean; set: (v: boolean) => void };
  siteConfig: SiteConfig;
  wins: WinInfo[];
  chrome: ChromeStrings;
  history: string[];
  clearHistory: () => void;
  clearLog: () => void;
  /** The same list passed to <ToOSDesktop menuItems>, with dividers dropped
   *  and folders recursively flattened to their leaf items — a flat
   *  convenience view for custom commands that don't care about `cwd`.
   *  Empty if the Terminal wasn't given an `items` prop. */
  items: MenuLeaf[];
  /** The raw, un-flattened `items` prop (folders intact) — what the
   *  built-in `ls`/`cd`/`cat`/`open`/`rm` resolve paths against via
   *  `resolvePath`/`listDir` (see `../terminal/fs`), so folders behave like
   *  real directories relative to `cwd`. */
  menu: MenuItem[];
  open: (id: string) => void;
  deleted: string[];
  remove: (ids: string[]) => void;
  /** Epoch ms of the last (simulated) boot — for a real `uptime`. */
  bootTime: number;
  /** The virtual `~/links` folder — empty if the Terminal wasn't given a
   *  `links` prop. */
  links: LinkItem[];
};

export type Command = {
  run: (ctx: CommandCtx) => void;
  /** Usage lines shown for `<cmd> --help`. First line conventionally
   *  "<cmd> — one-line description". */
  usage?: string[];
};

/** id → Command. Modules can export their own and merge them in:
 *  `{...DEFAULT_COMMANDS, ...aboutModule.commands, ...myOwnCommands}`. */
export type CommandRegistry = Record<string, Command>;
