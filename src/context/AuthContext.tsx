import { createContext, useContext, useEffect, useState } from "react";
import {
  getCurrentUserInfo,
  introspect,
  login,
  logout,
  type AuthTokens,
} from "../lib/api";

const STORAGE_KEY = "fe-ecommerce-auth";
const WORKSPACE_KEY = "fe-ecommerce-workspace";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";
export type Workspace = "admin" | "staff";

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

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
}

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
      const tokenInfo = await introspect(tokens.accessToken);
      if (tokenInfo?.username) {
        nextSession.user.username = tokenInfo.username;
      }
    } catch {
      // Token introspection is optional for the login flow.
    }

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
    } finally {
      clearStoredSession();
      setSession(null);
      setStatus("unauthenticated");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        session,
        error,
        setError,
        signIn,
        signOut,
      }}
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

export function getPreferredWorkspace(): Workspace | null {
  try {
    const value = localStorage.getItem(WORKSPACE_KEY);
    return value === "admin" || value === "staff" ? value : null;
  } catch {
    return null;
  }
}

export function setPreferredWorkspace(workspace: Workspace) {
  localStorage.setItem(WORKSPACE_KEY, workspace);
}

export function getHomePathForRoles(
  roles: string[] | undefined,
  preferredWorkspace?: Workspace | null,
) {
  const hasAdmin = roles?.includes("ROLE_ADMIN") ?? false;
  const hasStaff = roles?.includes("ROLE_STAFF") ?? false;

  if (hasAdmin && hasStaff) {
    return preferredWorkspace === "staff" ? "/staff" : "/admin/dashboard";
  }

  if (hasAdmin) {
    return "/admin/dashboard";
  }

  if (hasStaff) {
    return "/staff";
  }

  return "/admin/dashboard";
}
