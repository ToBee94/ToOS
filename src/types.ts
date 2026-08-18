import type { FC } from "react";

/** A single tab inside a (possibly tabbed) window. */
export type ModuleTab = { key: string; label: { de: string; en: string }; C: FC };

/** A registered module (page). `load` powers dynamic import()/code-splitting;
 *  `tabs` resolves once loaded. Framework windows with a single tab render
 *  untabbed. */
export type ModuleDef = {
  id: string;
  /** Per-locale route slug, e.g. { de: "ueber-mich", en: "about" }. */
  slug: { de: string; en: string };
  load: () => Promise<{ tabs: ModuleTab[] }>;
  /** Set for pages that need elevated (`sudo`) permission to remove/reveal. */
  protected?: boolean;
};
