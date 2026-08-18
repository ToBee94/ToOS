# Deep linking

ToOS is a client-side window manager — by default, switching which window
is focused doesn't touch the URL. `onTopChange` closes that gap without
coupling ToOS to any particular router:

```tsx
<ToOSDesktop
  // ...
  onTopChange={(id) => {
    if (!id) return;               // every window closed/minimized
    const href = hrefFor(id, locale);
    if (href) navigate(href);
  }}
/>
```

It fires whenever the topmost (focused, non-minimized) window changes,
including `null` when nothing is open. ToOS only reports *what* changed —
mapping an id to a URL, and deciding whether a given window even has a
route, is entirely your call:

```tsx
const ROUTED_IDS = new Set(["start", "about", "career", "impressum"]); // real pages only
const hrefFor = (id, locale) => (id === "start" ? homeHref(locale) : pageHref(locale, SLUG[id]));

<ToOSDesktop
  onTopChange={(id) => {
    if (!id || !ROUTED_IDS.has(id)) return; // skip ephemeral panels (terminal, settings, ...)
    navigate(hrefFor(id, locale));
  }}
/>
```

A couple of things worth keeping in mind:

- **Skip the first call.** `onTopChange` also fires once after mount with
  whatever window opened first — which the page's own route already
  reflects (if you're server-rendering per-route with an `initial` prop).
  Navigating again there just pushes a redundant history entry. Guard it
  with a ref:

  ```tsx
  const firstTop = useRef(true);
  // ...
  onTopChange={(id) => {
    if (firstTop.current) { firstTop.current = false; return; }
    // ...
  }}
  ```

- **Not every window needs a route.** Ephemeral OS panels (a terminal,
  Settings, a changelog) usually don't have — or need — a prerendered page.
  Filter `onTopChange` down to only the ids that do, the same way the
  example above does with `ROUTED_IDS`.

See [ToOS-Demo](https://github.com/ToBee94/ToOS-Demo) for a complete,
working version of this wiring against `react-router-dom`.
