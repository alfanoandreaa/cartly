"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  ACCENT_STORAGE_KEY,
  ACCENT_THEMES,
  DEFAULT_ACCENT,
  accentById,
  type AccentId
} from "@/lib/theme";

type ThemeContextValue = {
  accent: AccentId;
  setAccent: (id: AccentId) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  accent: DEFAULT_ACCENT,
  setAccent: () => {}
});

function applyAccent(id: AccentId) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--accent-rgb", accentById(id).rgb);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start from the default so server and first client render match; the stored
  // choice is applied right after mount (no hydration mismatch, brief flash at
  // most). The default accent already lives in globals.css.
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);

  useEffect(() => {
    const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (stored && ACCENT_THEMES.some((theme) => theme.id === stored)) {
      setAccentState(stored as AccentId);
      applyAccent(stored as AccentId);
    }
  }, []);

  function setAccent(id: AccentId) {
    setAccentState(id);
    applyAccent(id);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, id);
  }

  return <ThemeContext.Provider value={{ accent, setAccent }}>{children}</ThemeContext.Provider>;
}

export function useAccent() {
  return useContext(ThemeContext);
}
