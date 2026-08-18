# ToOS

[![CI](https://github.com/ToBee94/ToOS/actions/workflows/ci.yml/badge.svg)](https://github.com/ToBee94/ToOS/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40tobee94%2Ftoos.svg)](https://www.npmjs.com/package/@tobee94/toos)
[![License: MIT](https://img.shields.io/badge/license-MIT-informational.svg)](./LICENSE)

**A desktop-shell-styled React framework.** Draggable windows, a taskbar, a
start menu, boot/lock/shutdown/wipe screens, a real terminal with its own
virtual filesystem, and a ready-made Settings panel — built for
portfolio/personal sites that want a fake-OS aesthetic without writing a
window manager from scratch.

![ToOS in light and dark mode](./.github/assets/screenshot.png)
<sub>[ToOS-Demo](https://github.com/ToBee94/ToOS-Demo), a standalone app built on this package. See [tobee94.de](https://tobee94.de) for a full real-world example — the site this framework was extracted from.</sub>

```
guest@demo:~$ ls
docs/   start   about   terminal   settings   links/
guest@demo:~$ cd docs && ls
guide   api
guest@demo:~/docs$ open guide
opening: docs/guide …
```

ToOS ships **zero content**. No pages, no copy, no translations beyond its
own small chrome vocabulary (boot screens, notifications, terminal
messages). You register your own modules and supply your own copy — ToOS
is the shell around them.

**[Try the demo →](https://github.com/ToBee94/ToOS-Demo)** (clone it,
`npm install && npm run dev`), see **[tobee94.de](https://tobee94.de)** for a
full real-world site built on it, or read the [full documentation](./docs).

## Features

- 🪟 **Window manager** — draggable, resizable, minimize/maximize, tabbed
  windows with an automatic side nav once a window has more than one tab.
- 🗂️ **Menu & folders** — a start menu built from a flat `MenuItem[]`, with
  expandable folders for submenus. Folders are real terminal directories
  too, not just a visual grouping.
- 💻 **Terminal** — a full REPL (history, reverse-search, tab-completion)
  driven by a plain command registry. Ships a ~30-command default pack
  (`ls`/`cd`/`cat`/`open`/`rm`, `top`/`df`/`free`/`uptime`, `sudo`/`su`,
  `config`/`theme`/`language`, …) plus a path-aware virtual filesystem
  shared between the menu, a `~/links` folder, and your own commands.
- ⚙️ **Settings** — a ready-made, four-tab preferences window (design,
  language, content, about) you can use as-is or pick apart.
- 🎨 **Theming** — light/dark/system, a selectable accent colour, a pride
  skin, and a generic content-gate flag — all reactive, all persisted.
- 🌐 **Locale-agnostic** — no router coupling; you own locale state and
  your own content translations, ToOS only ships its own small chrome
  vocabulary (currently `de`/`en`, plus an optional "klingon" overlay
  mechanism you can reuse for your own content).
- 🔗 **Deep linking** — an `onTopChange` hook reports the focused window so
  you can sync it to your router, without ToOS knowing your routes exist.
- 📦 **Bring your own build** — a Vite library build, raw (uncompiled)
  Tailwind v4 source so your own Tailwind pass picks up every class ToOS
  uses, and a `file:`-linkable local dev workflow.

## Install

```bash
npm install @tobee94/toos
```

```css
/* your app's CSS entry point */
@import "tailwindcss";
@import "@tobee94/toos/style.css";
```

```tsx
import { useState } from "react";
import { ToOSDesktop, type SiteConfig, type MenuItem, type ModuleTab } from "@tobee94/toos";

const config: SiteConfig = {
  brand: <>my<span className="text-accent">site</span></>,
  user: "alex", host: "pc01", domain: "pc01.example.com",
  whoami: "alex — developer", version: "1.0.0", build: "42",
};

const MENU_ITEMS: MenuItem[] = [{ id: "start", label: "~", color: "text-accent" }];
const MODULES: Record<string, ModuleTab[]> = {
  start: [{ key: "main", label: { de: "", en: "" }, C: () => <p>Welcome.</p> }],
};

export default function App() {
  const [locale, setLocale] = useState("en");
  return (
    <ToOSDesktop
      config={config}
      locale={locale}
      onSwitchLocale={setLocale}
      initial="start"
      menuItems={MENU_ITEMS}
      resolveViews={(id) => MODULES[id] ?? MODULES.start}
      resolveBar={(id) => (id === "start" ? "~" : `~/${id}`)}
      resolveTitle={(id) => (id === "start" ? "" : id)}
    />
  );
}
```

That's a complete desktop: taskbar, start menu, boot animation, theming,
and the reset/lock/reboot system screens, for free.

## Documentation

| | |
|---|---|
| [Getting started](./docs/getting-started.md) | Install, stylesheet setup, quick start |
| [Site config](./docs/site-config.md) | `SiteConfig`, branding, cookie banner, motd |
| [Modules & the menu](./docs/modules.md) | `ModuleTab`, `MenuItem`, folders/submenus, tabbed windows |
| [Settings](./docs/settings.md) | The ready-made Design/Language/Content/About tabs |
| [Terminal](./docs/terminal.md) | Command registry, the virtual filesystem, writing your own commands |
| [Theming & locale](./docs/theming-and-locale.md) | Accent/pride/dark-mode, locale, the klingon overlay |
| [Deep linking](./docs/deep-linking.md) | Wiring the focused window to your router |

## What's deliberately out of scope

- Any personal content, translations, or SEO/meta tags — all consumer-owned.
- Analytics — wire up your own component alongside `<ToOSDesktop>`.
- Routing / SSR prerendering setup — bring your own (e.g. `vite-react-ssg`).

## Contributing

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint . (typed rules — react-hooks, typescript-eslint recommended + stylistic)
npm run build       # typecheck + vite library build

```

All three run in CI on every push/PR (see `.github/workflows/ci.yml`).

## License

MIT © Tobias Vorwachs
