import type { AuthTokens } from "./api";

const STORAGE_KEY = "fe-ecommerce-auth";

export interface StoredUser {
  uuid?: string;
  username: string;
  roles: string[];
}

export interface StoredSession {
  user: StoredUser;
  tokens: AuthTokens;
}

export function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredAccessToken(): string | null {
  return readStoredSession()?.tokens?.accessToken ?? null;
}

export function getStoredRefreshToken(): string | null {
  return readStoredSession()?.tokens?.refreshToken ?? null;
}

/** Persist a fresh token pair while keeping the current user info. */
export function updateStoredTokens(tokens: AuthTokens) {
  const current = readStoredSession();
  if (!current) return;
  writeStoredSession({ ...current, tokens });
}
