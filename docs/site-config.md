# Site config

`SiteConfig` is the one object that tells ToOS everything it needs to know
about your site instead of hardcoding it. Pass it to `<ToOSDesktop config={...}>`;
read it back anywhere with `useSiteConfig()`.

```ts
import type { SiteConfig } from "@tobee94/toos";

const config: SiteConfig = {
  productName: "myOS",                 // optional, defaults to "ToOS" — shown on boot/lock screens
  brand: <>my<span className="text-accent">site</span></>,  // taskbar wordmark, any ReactNode
  user: "alex",                        // fake shell username — prompt, whoami short form, boot lines
  host: "pc01",                        // short hostname
  domain: "pc01.example.com",          // full domain the `hostname` command prints
  whoami: "alex — developer, Berlin",  // full `whoami` line
  version: "1.0.0",
  build: "42",
  cookie: {                            // optional — see below
    line1: "This site uses analytics.",
    line2: "No tracking without consent.",
  },
  motd: [                              // optional — see below
    "Welcome. Type 'help' to see what's available.",
  ],
};
```

## Cookie banner

`<ToOSDesktop>` renders a cookie banner automatically. `cookie` is a
`Partial<{ title, command, line1, line2, output, accept, details }>` —
anything you don't set falls back to ToOS's own generic chrome copy (see
`src/lib/chrome/{de,en}.ts`), which is filler text, **not** real compliance
copy. Override at least `line1`/`line2` for anything that needs to be
accurate for your jurisdiction.

## Message of the day

`motd` (a string or `string[]`) is printed once when the terminal starts,
and again on the `motd` command. Leave it unset to fall back to ToOS's own
generic default line.

## Reading it back

```tsx
import { useSiteConfig } from "@tobee94/toos";

function VersionLabel() {
  const { version, build } = useSiteConfig();
  return <span>{version} · build {build}</span>;
}
```

`useSiteConfig()` throws if called outside `<ToOSDesktop>` — it's provided by
the desktop shell itself, not something you set up separately.
