// Registry of chrome locales ToOS ships translations for. A consumer's own
// content can support more locales than this — this list only bounds the
// framework's own small chrome vocabulary (notifications, boot/lock screens).
export const CHROME_LOCALES = ["de", "en"] as const;
export type ChromeLocale = (typeof CHROME_LOCALES)[number];
export const isChromeLocale = (l: string): l is ChromeLocale => (CHROME_LOCALES as readonly string[]).includes(l);
