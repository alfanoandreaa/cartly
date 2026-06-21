"use client";

import { useSession } from "next-auth/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  translate,
  type Locale,
  type TranslationKey
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key
});

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((entry) => entry.code === value);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  // Render the default locale on the server and first client paint, then swap to
  // the saved language after mount to keep hydration in sync.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const userChangedRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  // The language saved on the account follows the user across devices.
  const accountLocale = session?.user?.locale;
  useEffect(() => {
    if (userChangedRef.current) return;
    if (isLocale(accountLocale)) {
      setLocaleState(accountLocale);
      document.documentElement.lang = accountLocale;
      window.localStorage.setItem(LOCALE_STORAGE_KEY, accountLocale);
    }
  }, [accountLocale]);

  const setLocale = useCallback((next: Locale) => {
    userChangedRef.current = true;
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    void fetch("/api/user", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: next })
    }).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
