import type { ModuleTab } from "../../types";
import SettingsDesign from "./SettingsDesign";
import SettingsLanguage from "./SettingsLanguage";
import SettingsContent from "./SettingsContent";
import SettingsAbout from "./SettingsAbout";

/** Ready-to-use tabs for a "Settings" window — Design (theme/accent/pride),
 *  Language (DE/EN + klingon), Content (mature-content gate), About
 *  (version/build/browser info, check-for-updates, release notes via
 *  `open("changelog")`, factory-reset danger zone). All fully generic — no
 *  site content involved. Drop tabs you don't want, or concatenate your own
 *  (e.g. a multi-locale Language tab) instead of any of these. */
export const SETTINGS_TABS: ModuleTab[] = [
  { key: "design", label: { de: "Design", en: "Design" }, C: SettingsDesign },
  { key: "language", label: { de: "Sprache", en: "Language" }, C: SettingsLanguage },
  { key: "content", label: { de: "Inhalte", en: "Content" }, C: SettingsContent },
  { key: "about", label: { de: "Über", en: "About" }, C: SettingsAbout },
];

export { default as SettingsDesign } from "./SettingsDesign";
export { default as SettingsLanguage } from "./SettingsLanguage";
export { default as SettingsContent } from "./SettingsContent";
export { default as SettingsAbout } from "./SettingsAbout";
export { default as Seg } from "./Seg";
