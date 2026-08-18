import { de } from "./de";
import { en } from "./en";
import { klingon } from "./klingon";
import type { ChromeStrings } from "./types";

export type { ChromeStrings } from "./types";
export { CHROME_LOCALES, isChromeLocale, type ChromeLocale } from "./locales";

export const CHROME: Record<string, ChromeStrings> = { de, en };
export const chrome = (locale: string): ChromeStrings => CHROME[locale] ?? de;
export const chromeKlingon = (): ChromeStrings => klingon;
