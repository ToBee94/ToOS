# Modules & the menu

## A module is just an id + tab content

```ts
type ModuleTab = { key: string; label: { de: string; en: string }; C: React.FC };
```

A window opened by id resolves to a `ModuleTab[]` via `resolveViews`. One
entry → an untabbed window. More than one → ToOS renders a side nav
automatically, no extra wiring:

```tsx
const about: ModuleTab[] = [{ key: "main", label: { de: "Über", en: "About" }, C: About }];

const guide: ModuleTab[] = [
  { key: "quick-start", label: { de: "Quick Start", en: "Quick Start" }, C: QuickStart },
  { key: "concepts", label: { de: "Konzepte", en: "Concepts" }, C: Concepts },
];

const MODULES: Record<string, ModuleTab[]> = { about, guide };
```

`resolveViews`/`resolveBar`/`resolveTitle` are plain `(id: string) => ...`
functions passed to `<ToOSDesktop>` — a `Record` lookup, a `Map`, a
router-aware lookup, whatever fits your app. `resolveViews` is currently
synchronous; a declarative `ModuleDef.load()` manifest for per-module
`import()` code-splitting is sketched in `src/types.ts` but not implemented
yet.

## The `~/menu` (start menu)

`menuItems: MenuItem[]` is the flat list rendered in the start menu:

```ts
type MenuItem =
  | { id: string; label: string; color?: string; protected?: boolean }
  | { divider: true }
  | { id: string; label: string; color?: string; folder: true; items: MenuItem[] };
```

- A **leaf** (`id`/`label`) opens that window when clicked.
- `{ divider: true }` renders a visual separator.
- `protected: true` gates the entry the same way the terminal gates it —
  needs `theme.mature` on, or sudo, to open/cat/rm (see [Terminal](./terminal.md)).

## Folders (submenus)

A leaf can be replaced with a **folder**, which groups other `MenuItem`s
(including nested folders) under an expandable entry in the start menu:

```ts
const MENU_ITEMS: MenuItem[] = [
  { id: "start", label: "~", color: "text-accent" },
  { id: "about", label: "about", color: "text-cyan" },
  {
    id: "docs",
    label: "docs",
    color: "text-pink",
    folder: true,
    items: [
      { id: "guide", label: "guide", color: "text-cyan" },
      { id: "api", label: "api", color: "text-cyan" },
    ],
  },
];
```

Clicking `docs/` expands it in place, showing `guide` and `api` indented
underneath. Folders are **real directories in the terminal too**, not just a
menu grouping — `cd docs`, `ls`, `cat docs/guide`, `open docs/guide`, and
`rm -rf docs/` all work exactly like a real filesystem. See
[Terminal → the virtual filesystem](./terminal.md#the-virtual-filesystem)
for the full model.

`guide` and `api` here are still ordinary leaf ids — register them in your
module map (`MODULES.guide`, `MODULES.api`) exactly like any other window.
Ids must stay globally unique across the whole tree, folders included,
since the terminal, `open()`, and the deleted/reset state all key off a
flat id regardless of which folder (if any) a leaf lives in.

If you only need the flat list of openable ids (e.g. for a sitemap, or a
custom command that doesn't care about the folder structure), flatten it:

```ts
import { flattenMenuItems } from "@tobee94/toos";

const ids = flattenMenuItems(MENU_ITEMS).map((it) => it.id);
```

## Other `<ToOSDesktop>` props worth knowing

- `initial` — id of the window opened on first load (e.g. matching the
  current route for deep-link/SSR/SEO purposes).
- `noBootIds` — ids that open instantly, skipping the boot animation
  (typically the terminal, since re-running a boot sequence every time
  feels wrong for something that behaves like a shell).
- `changelogId` / `privacyId` — wires the notification center's "new
  version" card and the cookie banner's "details" link to open a specific
  window. Omit `changelogId` and that notification never appears at all.
- `onReset` — called during a factory reset, after ToOS clears its own
  `localStorage` keys, so you can clear your own (shell history, etc).
- `versionBadge` — the fixed bottom-right "`{productName} {version} · build
  {build}`" label. Defaults to shown; pass `false` to hide it.
- `onTopChange` — see [Deep linking](./deep-linking.md).
