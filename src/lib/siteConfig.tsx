import { createContext, useContext, type ReactNode } from "react";

/** Everything a consumer site plugs into the shell instead of ToOS hardcoding
 *  it: branding, the fake shell user/host, version info, and the small bits
 *  of copy the shell chrome itself needs (cookie banner, notifications). */
export type SiteConfig = {
  /** Product/OS name shown in boot/lock screens etc. Defaults to "ToOS". */
  productName?: string;
  /** Top-left taskbar wordmark. Any ReactNode — e.g. `tobee<span class="text-accent">94</span>`. */
  brand: ReactNode;
  /** Fake shell username, e.g. "tobias". Drives `whoami`'s short form, the prompt, boot lines. */
  user: string;
  /** Short hostname, e.g. "pc01". */
  host: string;
  /** Full domain the `hostname` command prints, e.g. "pc01.example.com". */
  domain: string;
  /** Full `whoami` line, e.g. "tobias — developer, Bremen, DE". */
  whoami: string;
  version: string;
  build: string;
  /** Cookie banner copy. Optional — unset fields fall back to ToOS's own
   *  chrome default (see lib/chrome), which is generic filler, not real
   *  compliance text. Override at least `line1`/`line2` for anything that
   *  actually needs to be accurate. */
  cookie?: Partial<{ title: string; command: string; line1: string; line2: string; output: string; accept: string; details: string }>;
  /** Message of the day — shown once when the terminal starts, and again on
   *  the `motd` command. String or multiple lines. Optional — falls back to
   *  ToOS's own generic chrome default (see lib/chrome) if unset. */
  motd?: string | string[];
};

export const SiteConfigCtx = createContext<SiteConfig | null>(null);
export function useSiteConfig(): SiteConfig {
  const c = useContext(SiteConfigCtx);
  if (!c) throw new Error("useSiteConfig() must be used inside <ToOSDesktop>");
  return c;
}
export function SiteConfigProvider({ config, children }: { config: SiteConfig; children: ReactNode }) {
  return <SiteConfigCtx.Provider value={config}>{children}</SiteConfigCtx.Provider>;
}
