"use client";

import { SessionProvider } from "next-auth/react";
import { RememberGuard } from "@/components/auth/remember-guard";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <I18nProvider>
          <RememberGuard />
          {children}
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
