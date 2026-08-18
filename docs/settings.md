# Settings

ToOS ships a ready-made Settings window with four tabs — you don't have to
build a preferences UI yourself:

```tsx
import { SETTINGS_TABS } from "@tobee94/toos";

const MODULES: Record<string, ModuleTab[]> = {
  // ...
  settings: SETTINGS_TABS,
};
```

That's the entire window: `SETTINGS_TABS` is already a `ModuleTab[]`
(tabbed, side-nav rendered automatically), covering:

- **Design** — theme (system/light/dark), accent colour, pride skin toggle.
  Pure generic UI, no site content — safe to use as-is in any consumer.
- **Language** — locale switch + the klingon overlay toggle.
- **Content** — the `mature` content-gate flag (relabel however fits your
  site, e.g. "18+").
- **About** — version/build/browser/platform/screen info, a "check for
  updates" simulation, and a danger-zone factory-reset button.

Each tab is also exported individually (`SettingsDesign`, `SettingsLanguage`,
`SettingsContent`, `SettingsAbout`, plus the shared `Seg` segmented-control
primitive they're built from) if you want to build your own custom tab set
— e.g. reuse `SettingsDesign` verbatim but write your own "About" tab with
extra site-specific content:

```tsx
import { SettingsDesign, SettingsLanguage } from "@tobee94/toos";

function MyAbout() {
  return <p>Custom about content, release notes, whatever your site needs.</p>;
}

const settings: ModuleTab[] = [
  { key: "design", label: { de: "Design", en: "Design" }, C: SettingsDesign },
  { key: "language", label: { de: "Sprache", en: "Language" }, C: SettingsLanguage },
  { key: "about", label: { de: "Über", en: "About" }, C: MyAbout },
];
```

All of it reads from the same contexts as the rest of ToOS
(`useTheme()`, `useLocale()`/`useSwitchLocale()`, `useKlingon()`,
`useResetArmed()`) — nothing Settings-specific to wire up.
