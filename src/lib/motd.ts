/** Normalizes SiteConfig.motd (string | string[] | undefined) to display
 *  lines, falling back to the chrome default when unset. */
export function motdLines(motd: string | string[] | undefined, fallback: string): string[] {
  if (!motd) return [fallback];
  return Array.isArray(motd) ? motd : [motd];
}
