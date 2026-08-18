# ToOS

A desktop-shell-styled React framework: draggable windows, a taskbar, a
start menu, boot/lock/shutdown/wipe screens, light/dark theming with a
selectable accent colour, a pride skin, and a "klingon mode" easter-egg
overlay mechanism. Built for portfolio/personal sites that want a fake-OS
aesthetic without writing the window manager themselves.

ToOS does not ship any content, translations, or page components. You
register your own pages as modules and supply your own copy.

## Install

```bash
npm install toos
```

During local development against an unpublished version, point at the repo
directly:

```json
{ "dependencies": { "toos": "file:../toos" } }
```

Import the stylesheet once, alongside Tailwind v4 in your own app:

```css
@import "toos/style.css";
```

`toos/style.css` defines the design tokens (`--color-*`, `--font-*`) as a
Tailwind `@theme`. Override any of them in your own CSS to reskin; the
default fonts are "Inter Variable" and "JetBrains Mono Variable" — load
those yourself (e.g. via `@fontsource-variable/*`) or override `--font-sans`
/ `--font-display` / `--font-mono` to point at your own.

## Quick start

```tsx
import { ToOSDesktop, type SiteConfig, type ModuleTab } from "toos";

const config: SiteConfig = {
  brand: <>my<span className="text-accent">site</span></>,
  user: "alex",
  host: "pc01",
  domain: "pc01.example.com",
  whoami: "alex — developer",
  version: "1.0.0",
  build: "42",
  cookie: {
    title: "cookie-notice.sh",
    command: "cat privacy",
    line1: "This site uses analytics.",
    line2: "…",
    output: "→ done.",
    accept: "Got it",
    details: "Details",
  },
};

const about: ModuleTab[] = [{ key: "main", label: { de: "Über", en: "About" }, C: About }];
const views: Record<string, ModuleTab[]> = { start: startTabs, about };

export default function App() {
  const [locale, setLocale] = useState("en");
  return (
    <ToOSDesktop
      config={config}
      locale={locale}
      onSwitchLocale={setLocale}
      initial="start"
      menuItems={[{ id: "about", label: "about" }]}
      resolveViews={(id) => views[id]}
      resolveBar={(id) => (id === "start" ? "~" : `~/${id}`)}
      resolveTitle={(id) => (id === "start" ? "" : id)}
    />
  );
}
```

## Module system

A module is just an id plus its tab content: `ModuleTab = { key, label:
{de, en}, C: FC }`. A window is untabbed when it resolves to a single tab,
tabbed when it resolves to more than one (see `SettingsDesign` /
`SettingsLanguage`-style multi-tab windows). `resolveViews`/`resolveBar`/
`resolveTitle` are plain functions — how you look up a module by id (a
`Record`, a `Map`, a router-aware lookup) is entirely up to you.

`resolveViews` is currently synchronous. Per-module `dynamic import()`
code-splitting and a declarative `ModuleDef.load()` manifest (see
`src/types.ts`) is the planned next step — not implemented yet. Once modules
load via `import()`, a module can ship its own CSS for free: `import
"./MyModule.css"` at the top of the module file gets code-split alongside
its JS chunk by Vite and only loads when that module does — no extra ToOS
plumbing required.

## Terminal / command registry

Not implemented yet. The planned design is a `registerCommand(name,
handler, usage)` registry with a built-in default command pack for generic
OS-sim commands (`top`, `df`, `uptime`, `whoami`, `config`, `sudo`, …), and
consumer apps (and, per the same registry, individual **modules**) register
their own commands on top — a module should be able to ship the commands it
needs alongside its content, not only through one flat top-level list.

## Theming

`ThemeCtx` (via `useTheme()`) exposes `pref`/`resolved` (light/dark),
`accent`, `pride`, and a generic `mature` content-gate flag — relabel it
however fits your site (e.g. "18+"). `ToOSDesktop` persists all of these to
`localStorage` under `toos-*` keys and reacts to `prefers-color-scheme`
automatically when `pref === "system"`.

## Locale

ToOS never derives the current locale itself (no router coupling) — pass it
in via the `locale` prop and handle `onSwitchLocale` however your routing
works. ToOS's own chrome copy (notifications, boot/lock screens, the
shutdown/reboot confirm dialog) ships in `de`/`en`, defined in
`src/lib/chrome/{de,en}.ts` — see `src/lib/chrome/klingon.ts` for how the
optional overlay mode plugs in. Your own page content and translations are
entirely your own responsibility; ToOS only exposes `useLocale()` and
`useKlingon()` so your components can read the same state.

## What's deliberately out of scope

- Any personal content, translations, or SEO/meta tags — all consumer-owned.
- Analytics (Matomo, etc.) — wire up your own component alongside
  `<ToOSDesktop>`.
- Routing / SSR prerendering setup — bring your own (e.g. `vite-react-ssg`).

## License

MIT
