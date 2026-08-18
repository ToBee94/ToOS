# Theming & locale

## Theming

`useTheme()` (backed by `ThemeCtx`) exposes:

```ts
{
  pref: "system" | "light" | "dark"; setPref: (p) => void;
  resolved: "light" | "dark"; // pref === "system" resolved against prefers-color-scheme
  accent: string; setAccent: (a) => void;       // one of ACCENTS
  pride: boolean; setPride: (v) => void;
  mature: boolean; setMature: (v) => void;      // generic content-gate flag
}
```

`<ToOSDesktop>` persists all of it to `localStorage` under `toos-*` keys and
reacts to `prefers-color-scheme` changes live when `pref === "system"`.
`ACCENTS` (exported) is the list of selectable accent colours, used by the
Settings "Design" tab and the terminal's `accent` command.

`mature` is intentionally generic — relabel it however fits your site (an
"18+" toggle, a spoiler gate, whatever). It's the same flag `protected`
menu items and `~/links` entries check.

Reskin by overriding the `--color-*`/`--font-*` custom properties from
`@tobee94/toos/style.css` in your own CSS — see
[Getting started → Stylesheet](./getting-started.md#stylesheet).

## Locale

ToOS never derives the current locale itself — no router coupling. Pass it
in via the `locale` prop and handle `onSwitchLocale` however your routing
works:

```tsx
<ToOSDesktop locale={locale} onSwitchLocale={(l) => navigate(hrefFor(l))} ... />
```

ToOS's own **chrome** copy — notifications, boot/lock screens, the
shutdown/reboot confirm dialog, the terminal's built-in messages — ships in
`de`/`en` (`src/lib/chrome/{de,en}.ts`), completely separate from your own
page content and translations. `useChrome()` returns the right set for the
active locale (and the klingon overlay, if on).

Your own content translations are entirely your own responsibility — ToOS
only exposes `useLocale()` so your components can read the same state the
shell is using.

## The klingon overlay

A generic "gimmick overlay" mechanism: `useKlingon()` (`{ on, set }`) is a
single boolean flag, toggled from the terminal (`language klingon`) or the
Settings "Language" tab. When on:

- ToOS's own chrome copy switches to `src/lib/chrome/klingon.ts`.
- Your own content can opt into the same overlay by checking `useKlingon().on`
  and swapping in your own klingon-ified strings — it's the same flag, so
  toggling it once affects both the framework chrome and your content
  consistently.
