import {
  clearStoredSession,
  getStoredRefreshToken,
  updateStoredTokens,
} from "./authStorage";

export const API_BASE_URL = "http://localhost:8080/e-commerce";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface TokenIntrospectResult {
  active: boolean;
  username: string;
  tokenType: string;
  expiresAt: number;
}

export interface CurrentUserInfo {
  id: number;
  username: string;
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  address: string | null;
  roles: string[];
  isEnabled: boolean;
}

export interface LogoutResult {
  success: boolean;
}

/** Error thrown by the API layer, carrying the backend error code. */
export class ApiError extends Error {
  code?: number;
  status: number;

  constructor(message: string, status: number, code?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const rawBody = await response.text();
  const parsedBody = rawBody
    ? (JSON.parse(rawBody) as ApiResponse<T>)
    : undefined;

  if (!response.ok || !parsedBody || parsedBody.code !== 1000) {
    throw new ApiError(
      parsedBody?.message || rawBody || "Request failed",
      response.status,
      parsedBody?.code,
    );
  }

  return parsedBody.result;
}

async function rawRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

/** Public unauthenticated request helper. */
export function requestJson<T>(path: string, options: RequestOptions = {}) {
  return rawRequest<T>(path, options);
}

let refreshPromise: Promise<AuthTokens> | null = null;

/** Exchange the stored refresh token for a new token pair (deduplicated). */
export function refresh(): Promise<AuthTokens> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new ApiError("No refresh token", 401));
  }

  refreshPromise = rawRequest<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  })
    .then((tokens) => {
      updateStoredTokens(tokens);
      return tokens;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Authenticated request. On a 401/expired token it refreshes once and retries.
 * If the refresh fails the stored session is cleared so guards send the user
 * back to the login screen.
 */
export async function authRequest<T>(
  path: string,
  token: string,
  options: Omit<RequestOptions, "token"> = {},
): Promise<T> {
  try {
    return await rawRequest<T>(path, { ...options, token });
  } catch (error) {
    const isAuthError = error instanceof ApiError && error.status === 401;
    if (!isAuthError) throw error;

    try {
      const tokens = await refresh();
      return await rawRequest<T>(path, {
        ...options,
        token: tokens.accessToken,
      });
    } catch (refreshError) {
      clearStoredSession();
      throw refreshError;
    }
  }
}

export function login({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  return rawRequest<AuthTokens>("/auth/login", {
    method: "POST",
    body: { username, password },
  });
}

export function logout(token: string) {
  return rawRequest<LogoutResult>("/auth/logout", {
    method: "POST",
    body: { token },
  });
}

export function introspect(token: string) {
  return rawRequest<TokenIntrospectResult>("/auth/introspect", {
    method: "POST",
    body: { token },
  });
}

export function getCurrentUserInfo(token: string) {
  return authRequest<CurrentUserInfo>("/users/my-info", token);
}

export function register(payload: {
  username: string;
  password?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
}) {
  return rawRequest<void>("/auth/register", {
    method: "POST",
    body: payload,
  });
}
