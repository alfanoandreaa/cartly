// "Remember me" support. When the user opts out, we want the login to behave
// like a session cookie: survive reloads within the same browser session, but
// be dropped once the browser is fully closed and reopened. We detect that with
// a sessionStorage heartbeat (cleared by the browser on shutdown).

export const REMEMBER_STORAGE_KEY = "cartly:remember";
export const SESSION_ALIVE_KEY = "cartly:session-alive";

export function setRememberPreference(remember: boolean) {
  try {
    window.localStorage.setItem(REMEMBER_STORAGE_KEY, remember ? "true" : "false");
  } catch {
    // storage unavailable — fall back to the default persistent session
  }
}
