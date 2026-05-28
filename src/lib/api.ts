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

async function requestJson<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

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

  let payload: ApiResponse<T> | undefined;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload || payload.code !== 1000) {
    const message = payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload.result;
}

export function login({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  return requestJson<AuthTokens>("/auth/login", {
    method: "POST",
    body: { username, password },
  });
}

export function logout(token: string) {
  return requestJson<LogoutResult>("/auth/logout", {
    method: "POST",
    body: { token },
  });
}

export function introspect(token: string) {
  return requestJson<TokenIntrospectResult>("/auth/introspect", {
    method: "POST",
    body: { token },
  });
}

export function getCurrentUserInfo(token: string) {
  return requestJson<CurrentUserInfo>("/users/my-info", {
    token,
  });
}
