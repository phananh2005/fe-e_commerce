import { createContext, useContext, useEffect, useState } from "react";
import {
  getCurrentUserInfo,
  introspect,
  login,
  logout,
  type AuthTokens,
} from "../lib/api";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "../lib/authStorage";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export interface AuthSession {
  user: {
    username: string;
    roles: string[];
  };
  tokens: AuthTokens;
}

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  error: string;
  setError: (value: string) => void;
  signIn: (payload: {
    username: string;
    password: string;
  }) => Promise<AuthSession>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      const storedSession = readStoredSession();

      if (!storedSession?.tokens?.accessToken) {
        setStatus("unauthenticated");
        setSession(null);
        return;
      }

      try {
        const tokenInfo = await introspect(storedSession.tokens.accessToken);

        if (!tokenInfo?.active) {
          clearStoredSession();
          setSession(null);
          setStatus("unauthenticated");
          return;
        }

        const currentUser = await getCurrentUserInfo(
          storedSession.tokens.accessToken,
        );

        const nextSession: AuthSession = {
          ...storedSession,
          user: {
            username: tokenInfo.username || storedSession.user.username,
            roles: currentUser.roles ?? storedSession.user.roles ?? [],
          },
        };

        writeStoredSession(nextSession);
        setSession(nextSession);
        setStatus("authenticated");
      } catch {
        clearStoredSession();
        setSession(null);
        setStatus("unauthenticated");
      }
    };

    void bootstrap();
  }, []);

  const signIn = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    setError("");

    const tokens = await login({ username, password });
    const nextSession: AuthSession = {
      user: { username, roles: [] },
      tokens,
    };

    try {
      const currentUser = await getCurrentUserInfo(tokens.accessToken);
      nextSession.user.roles = currentUser.roles ?? [];
      if (currentUser.username) {
        nextSession.user.username = currentUser.username;
      }
    } catch {
      // Fall back to the username and empty roles when profile lookup fails.
    }

    writeStoredSession(nextSession);
    setSession(nextSession);
    setStatus("authenticated");
    return nextSession;
  };

  const signOut = async () => {
    setError("");

    try {
      if (session?.tokens?.accessToken) {
        await logout(session.tokens.accessToken);
      }
    } catch {
      // Ignore network/logout errors — clear the session regardless.
    } finally {
      clearStoredSession();
      setSession(null);
      setStatus("unauthenticated");
    }
  };

  return (
    <AuthContext.Provider
      value={{ status, session, error, setError, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

/** Admins land in the admin console; everyone else goes to the shop. */
export function getHomePathForRoles(roles: string[] | undefined) {
  return roles?.includes("ROLE_ADMIN") ? "/admin/dashboard" : "/";
}
