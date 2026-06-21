"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
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

function isAccentId(value: unknown): value is AccentId {
  return typeof value === "string" && ACCENT_THEMES.some((theme) => theme.id === value);
}

function applyAccent(id: AccentId) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--accent-rgb", accentById(id).rgb);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);
  // Once the user picks a colour in this session, stop letting the (possibly
  // stale) account value reassert itself until the next reload.
  const userChangedRef = useRef(false);

  // The personal accent belongs to the account, not the browser. Signed-out
  // visitors (e.g. on the public marketing pages) always see the default colour,
  // so a previous user's accent never leaks before login. Signed-in members get
  // their saved colour, falling back to the locally cached one for an instant
  // paint across reloads.
  const accountAccent = session?.user?.accentColor;
  useEffect(() => {
    if (userChangedRef.current) return;
    if (status === "loading") return;

    if (status === "authenticated") {
      const cached = window.localStorage.getItem(ACCENT_STORAGE_KEY);
      const next = isAccentId(accountAccent)
        ? accountAccent
        : isAccentId(cached)
          ? cached
          : DEFAULT_ACCENT;
      setAccentState(next);
      applyAccent(next);
      if (isAccentId(accountAccent)) {
        window.localStorage.setItem(ACCENT_STORAGE_KEY, accountAccent);
      }
    } else {
      // Not logged in: show the last-used accent from this browser so the
      // homepage already has the user's colour before they authenticate.
      const cached = window.localStorage.getItem(ACCENT_STORAGE_KEY);
      const next = isAccentId(cached) ? cached : DEFAULT_ACCENT;
      setAccentState(next);
      applyAccent(next);
    }
  }, [status, accountAccent]);

  function setAccent(id: AccentId) {
    userChangedRef.current = true;
    setAccentState(id);
    applyAccent(id);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, id);
    // Persist to the account (no-op for signed-out / demo users).
    void fetch("/api/user", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accentColor: id })
    }).catch(() => {});
  }

  return <ThemeContext.Provider value={{ accent, setAccent }}>{children}</ThemeContext.Provider>;
}

export function useAccent() {
  return useContext(ThemeContext);
}
