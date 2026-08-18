# Getting started

## Install

```bash
npm install @tobee94/toos
```

`react`, `react-dom`, and `react-router-dom` are peer dependencies — ToOS
expects your app to already have them.

While developing against an unpublished version, point at the repo directly
with a `file:` dependency:

```json
{ "dependencies": { "@tobee94/toos": "file:../toos" } }
```

## Stylesheet

ToOS ships its design tokens and component classes as **raw, uncompiled**
Tailwind v4 source (not a precompiled CSS bundle) — this is deliberate.
Tailwind v4 skips `node_modules` when scanning for classes by default, and a
precompiled stylesheet would mean your own Tailwind build never runs at all.
So: import both, in this order, in your app's own CSS entry point:

```css
@import "tailwindcss";
@import "@tobee94/toos/style.css";
```

`@tobee94/toos/style.css` declares `@source "./**/*.{ts,tsx}"` for its own
package source, so your Tailwind build picks up ToOS's component classes
automatically — no extra `content`/`@source` configuration needed on your
side.

It also defines the design tokens (`--color-*`, `--font-*`) as a Tailwind
`@theme`. Override any of them in your own CSS to reskin. The default fonts
are "Inter Variable" and "JetBrains Mono Variable" — load those yourself
(e.g. via `@fontsource-variable/inter` / `@fontsource-variable/jetbrains-mono`)
or override `--font-sans` / `--font-display` / `--font-mono` to point at
your own.

If you use local `file:` links during development, also dedupe React so two
copies never end up loaded at once:

```ts
// vite.config.ts
export default defineConfig({
  resolve: { dedupe: ["react", "react-dom", "react-router-dom"] },
});
```

## Quick start

```tsx
import { useState } from "react";
import { ToOSDesktop, type SiteConfig, type ModuleTab, type MenuItem } from "@tobee94/toos";

const config: SiteConfig = {
  brand: <>my<span className="text-accent">site</span></>,
  user: "alex",
  host: "pc01",
  domain: "pc01.example.com",
  whoami: "alex — developer",
  version: "1.0.0",
  build: "42",
};

function About() {
  return <p>Hello from a module.</p>;
}

const MODULES: Record<string, ModuleTab[]> = {
  start: [{ key: "main", label: { de: "", en: "" }, C: () => <p>Welcome.</p> }],
  about: [{ key: "main", label: { de: "Über", en: "About" }, C: About }],
};

const MENU_ITEMS: MenuItem[] = [
  { id: "start", label: "~", color: "text-accent" },
  { id: "about", label: "about", color: "text-cyan" },
];

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

That's a complete, working desktop: a taskbar, a start menu with two
entries, boot animation on window open, theming, and the reset/lock/reboot
system screens — all for free.

## Where to go next

- Add real content → [Modules & the menu](./modules.md)
- Add the ready-made Settings window → [Settings](./settings.md)
- Add a terminal → [Terminal](./terminal.md)
- See it all wired together → [ToOS-Demo](https://github.com/ToBee94/ToOS-Demo)
