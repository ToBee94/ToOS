import { createContext, useContext } from "react";

export type ThemePref = "system" | "light" | "dark";

/** Selectable primary (accent) colours. Empty accent = theme default (first entry). */
export const ACCENTS: { key: string; hex: string }[] = [
  { key: "green", hex: "#a3e635" },
  { key: "cyan", hex: "#38bdf8" },
  { key: "pink", hex: "#f472b6" },
  { key: "amber", hex: "#fbbf24" },
  { key: "purple", hex: "#c084fc" },
  { key: "orange", hex: "#fb923c" },
];

/** Theme preference (persisted) + resolved light/dark + accent + pride skin +
 *  a generic "mature content" gate (rename/relabel freely per site). */
export const ThemeCtx = createContext<{
  pref: ThemePref;
  setPref: (t: ThemePref) => void;
  resolved: "light" | "dark";
  accent: string;
  setAccent: (a: string) => void;
  pride: boolean;
  setPride: (v: boolean) => void;
  mature: boolean;
  setMature: (v: boolean) => void;
}>({ pref: "system", setPref: () => {}, resolved: "dark", accent: "", setAccent: () => {}, pride: false, setPride: () => {}, mature: false, setMature: () => {} });

export const useTheme = () => useContext(ThemeCtx);
