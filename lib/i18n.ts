export const copy = {
  en: {
    brand: "Cartly",
    tagline: "Save it. Track it. Buy it when it’s right.",
    addPick: "Add a pick",
    upgrade: "Upgrade to Cartly Pro",
    empty: "Nothing saved here yet."
  }
} as const;

export type Locale = keyof typeof copy;
