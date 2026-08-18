# Terminal

`<Terminal>` is a full REPL UI (log, history with ↑/↓ recall, reverse-search
with alt+r, tab-completion) driven by a plain command registry — it ships no
commands of its own by default.

```tsx
import { Terminal, DEFAULT_COMMANDS, type CommandRegistry } from "@tobee94/toos";

const commands: CommandRegistry = { ...DEFAULT_COMMANDS };

const terminal: ModuleTab[] = [{ key: "main", label: { de: "", en: "" }, C: () => <Terminal commands={commands} /> }];
```

Give it your module list and it becomes a real filesystem too:

```tsx
<Terminal commands={commands} items={MENU_ITEMS} links={LINKS} />
```

## `DEFAULT_COMMANDS`

A ready-made pack of generic OS-sim + module-registry commands, all reading
from `SiteConfig`/theme/locale state instead of anything hardcoded:

| | |
|---|---|
| **Info** | `help`, `motd`, `whoami`, `pwd`, `hostname`, `date`, `time`, `uptime`, `load`, `version` |
| **System sim** | `top`, `df`, `free`, `clear`, `history` |
| **Preferences** | `config`, `theme`, `accent`, `pride`, `language` (alias `lang`) |
| **Power** | `lock`, `sudo reboot`, `sudo shutdown`, `sudo reset` |
| **Session** | `sudo`, `su` (root-only after `sudo su`), `exit` |
| **Filesystem** | `ls`, `cat`, `open`, `rm`, `cd` |

`su`/`exit` toggle *persistent* elevation for the rest of the session
(unlike a one-shot `sudo <cmd>` prefix) — they're intercepted by `<Terminal>`
itself before dispatch, so they work even if you don't merge `DEFAULT_COMMANDS`
in; the registry entries exist only so `help`/tab-complete/`--help` know
about them. `su` requires `sudo` explicitly (bare `su` is refused) — once
elevated, the prompt and `whoami`'s shell username switch to `root`, and
`pwd`'s home path switches to `/root`.

## Writing your own commands

```ts
import type { Command, CommandRegistry } from "@tobee94/toos";

const hello: Command = {
  usage: ["hello — a custom command", "usage: hello [name]"],
  run: ({ push, arg }) => push(`hello, ${arg || "world"}!`, "text-accent"),
};

const commands: CommandRegistry = { ...DEFAULT_COMMANDS, hello };
```

`run` receives a `CommandCtx` with everything a command could need: parsed
`args`/`arg`/`path`, `sudo`/`elevated` state, `cwd`/`setCwd`, `push` (write a
line to the log), `theme`/`locale`/`klingon`/`siteConfig`/`chrome`
(translated framework copy), `history`, the resolved `items`/`menu`/`links`,
`open`/`deleted`/`remove`, and `bootTime`. See `src/terminal/types.ts` for
the full shape.

**Modules can ship their own commands too** — a module isn't limited to the
one flat list you pass to `<Terminal>`. Export a `commands` object from the
module and merge it in alongside the default pack and your own:

```ts
const commands: CommandRegistry = { ...DEFAULT_COMMANDS, ...myModule.commands, ...MY_COMMANDS };
```

Later entries win on key collision, so a module can deliberately override a
default command if it needs to.

## The virtual filesystem

`items` (your `MenuItem[]`, folders included) and `links` (see below) turn
`ls`/`cat`/`open`/`rm`/`cd` into a real, path-aware filesystem:

```
~$ ls
docs/   start   about   terminal   settings   links/
~$ cd docs
~/docs$ ls
guide   api
~/docs$ cat guide
docs/guide: try 'open docs/guide' to view it
~/docs$ open guide
opening: docs/guide …
~/docs$ cd ..
~$ cd links
~/links$ ls
github   npm
~/links$ cat github
https://github.com/ToBee94/ToOS
```

- **Folders** (see [Modules → Folders](./modules.md#folders-submenus)) are
  real directories: `cd` into them, `ls` lists their children, `cat`/`open`/
  `rm` resolve paths through them (`cat docs/guide` works from anywhere,
  `cat guide` works once you've `cd`'d into `docs`).
- **`rm`** requires sudo for `protected: true` entries. `rm *` clears
  everything removable in the current directory. `rm -rf <folder>`
  recursively removes everything inside a folder — and once it's fully
  empty, hides the folder itself too. `sudo rm -rf /` is the "wipe
  everything" factory-reset-adjacent command (same effect as the Settings
  danger-zone button).
- Tab-completion understands all of this, including nested typed paths
  (`rm docs/gu<TAB>` → `rm docs/guide`) and listing a directory's contents
  on a second `<TAB>` (`open links/<TAB>` → shows `github   npm`).

### `~/links`

A second, separate list for external references (social profiles, repos,
whatever isn't a module) that only exists in the terminal, not the start
menu:

```ts
import type { LinkItem } from "@tobee94/toos";

const LINKS: LinkItem[] = [
  { name: "github", label: "GitHub", url: "https://github.com/ToBee94/ToOS" },
  { name: "secret", label: "Secret", url: "https://example.com", note: "sudo-only example", protected: true },
];
```

`links` are always reachable as `~/links` regardless of `cwd` — typing
`open links/github` works whether you're at the root or already `cd`'d into
`links`. They're read-only: `rm` on a link reports it can't be removed
rather than silently no-op'ing.

### Building your own path-aware commands

If a custom command needs the same directory-walking `ls`/`cat`/etc. use,
the resolver is exported too:

```ts
import { resolvePath, listDir, joinPath } from "@tobee94/toos";

const full = joinPath(ctx.cwd, ctx.arg);       // "docs/guide"
const hit = resolvePath(ctx.menu, ctx.links, full); // { kind: "leaf" | "link" | "dir" | "notfound", ... }
```

## `motd`

Set via `SiteConfig.motd` (see [Site config](./site-config.md)) — printed
once when the terminal starts, and again on the `motd` command.
