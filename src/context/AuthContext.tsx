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
import {
  decodeJwtClaims,
  extractRoles,
  extractUsername,
} from "../lib/jwt";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export interface AuthSession {
  user: {
    id?: number;
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

        // Roles live in the access token's JWT claims — decode them
        // directly so we never depend on a second profile call.
        const claims = decodeJwtClaims(storedSession.tokens.accessToken);
        const tokenRoles = extractRoles(claims);

        const nextSession: AuthSession = {
          ...storedSession,
          user: {
            id: storedSession.user.id,
            username:
              tokenInfo.username ||
              extractUsername(claims, storedSession.user.username),
            roles: tokenRoles.length
              ? tokenRoles
              : storedSession.user.roles ?? [],
          },
        };

        try {
          const currentUser = await getCurrentUserInfo(storedSession.tokens.accessToken);
          if (currentUser.id) nextSession.user.id = currentUser.id;
        } catch {
          // ignore
        }

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
    // Roles live in the access token's JWT claims — decode them directly
    // so a failing profile lookup can't downgrade the session to a
    // customer and bounce admins to the shop.
    const claims = decodeJwtClaims(tokens.accessToken);
    const tokenRoles = extractRoles(claims);
    const nextSession: AuthSession = {
      user: {
        username: extractUsername(claims, username),
        roles: tokenRoles,
      },
      tokens,
    };

    try {
      const currentUser = await getCurrentUserInfo(tokens.accessToken);
      // Prefer the server profile when it returns roles, otherwise keep
      // the claims decoded from the token.
      nextSession.user.roles = currentUser.roles?.length
        ? currentUser.roles
        : tokenRoles;
      if (currentUser.username) {
        nextSession.user.username = currentUser.username;
      }
      nextSession.user.id = currentUser.id;
    } catch {
      // Keep the roles/username decoded from the JWT claims.
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
