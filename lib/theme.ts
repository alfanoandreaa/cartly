// Accent palette for the Settings theme picker. Each entry only ever replaces
// the "fluo yellow" accent — every other colour in the UI stays untouched.
// `rgb` is space-separated channels so it can drop straight into --accent-rgb.

export const ACCENT_THEMES = [
  { id: "lime", name: "Fluo Lime", rgb: "200 255 0", hex: "#C8FF00" },
  { id: "cyan", name: "Electric Cyan", rgb: "34 211 238", hex: "#22D3EE" },
  { id: "amber", name: "Sunset Amber", rgb: "251 191 36", hex: "#FBBF24" },
  { id: "violet", name: "Ultra Violet", rgb: "167 139 250", hex: "#A78BFA" },
  { id: "pink", name: "Hot Pink", rgb: "244 114 182", hex: "#F472B6" }
] as const;

export type AccentId = (typeof ACCENT_THEMES)[number]["id"];

export const DEFAULT_ACCENT: AccentId = "lime";
export const ACCENT_STORAGE_KEY = "cartly:accent";

export function accentById(id: string | null | undefined) {
  return ACCENT_THEMES.find((theme) => theme.id === id) ?? ACCENT_THEMES[0];
}
