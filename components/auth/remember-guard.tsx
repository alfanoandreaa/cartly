"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { REMEMBER_STORAGE_KEY, SESSION_ALIVE_KEY } from "@/lib/remember";

/**
 * Enforces the "remember me" choice. If the user opted out and the browser has
 * been closed and reopened (fresh launch with a still-valid cookie), we sign
 * them out. Logging in during the current session is never affected.
 */
export function RememberGuard() {
  const { status } = useSession();
  const freshLaunchRef = useRef(false);
  const settledRef = useRef(false);

  useEffect(() => {
    try {
      // A fresh browser launch has no heartbeat yet. Set it for the rest of the
      // session so reloads and in-session logins aren't mistaken for a restart.
      freshLaunchRef.current = window.sessionStorage.getItem(SESSION_ALIVE_KEY) !== "1";
      window.sessionStorage.setItem(SESSION_ALIVE_KEY, "1");
    } catch {
      freshLaunchRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Only act on the first resolved auth state. If the user authenticates later
    // in this same session, that's a deliberate fresh login — leave it alone.
    if (status === "loading" || settledRef.current) return;
    settledRef.current = true;
    if (status !== "authenticated") return;
    try {
      const stored = window.localStorage.getItem(REMEMBER_STORAGE_KEY);
      // First-time migration: key never set → default to "remember me".
      if (stored === null) {
        window.localStorage.setItem(REMEMBER_STORAGE_KEY, "true");
        return;
      }
      const optedOut = stored === "false";
      if (optedOut && freshLaunchRef.current) {
        // Clear the key so the next sign-in (default: remember=true) sticks.
        window.localStorage.removeItem(REMEMBER_STORAGE_KEY);
        signOut({ callbackUrl: "/auth/signin" });
      }
    } catch {
      // storage unavailable — keep the session
    }
  }, [status]);

  return null;
}
