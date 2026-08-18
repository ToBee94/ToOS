// Syntax-token accent colours — used by the menu (file tree) and the home
// dashboard cards. Literal class strings so Tailwind emits them.
export const PALETTE = {
  text: ["text-green", "text-cyan", "text-pink", "text-amber", "text-purple", "text-orange"],
  bg: ["bg-green", "bg-cyan", "bg-pink", "bg-amber", "bg-purple", "bg-orange"],
  hoverBorder: [
    "hover:border-green/50",
    "hover:border-cyan/50",
    "hover:border-pink/50",
    "hover:border-amber/50",
    "hover:border-purple/50",
    "hover:border-orange/50",
  ],
  groupHoverText: [
    "group-hover:text-green",
    "group-hover:text-cyan",
    "group-hover:text-pink",
    "group-hover:text-amber",
    "group-hover:text-purple",
    "group-hover:text-orange",
  ],
} as const;
