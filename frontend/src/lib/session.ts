// Utilisé uniquement dans des Client Components
const KEY = "sb_session"; // SecondBrain

export type Session = { userId: string; name: string };

export function setSession(s: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; } catch { return null; }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function isLoggedIn(): boolean {
  return !!getSession();
}
