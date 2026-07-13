export interface JwtClaims {
  [key: string]: unknown;
}

/**
 * Decode the payload of a JWT without verifying the signature. The frontend
 * only needs to read the claims (roles, username) that the backend already
 * signed; signature verification happens server-side on every request.
 */
export function decodeJwtClaims(token: string): JwtClaims | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) {
      payload += "=".repeat(4 - pad);
    }

    const binary = atob(payload);
    const json = decodeURIComponent(
      binary
        .split("")
        .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/**
 * Extract role claims from a decoded JWT. Backends expose roles under
 * different keys (`roles`, `authorities`, `scope`, ...), sometimes as an
 * array and sometimes space/comma separated — normalize all of them.
 */
export function extractRoles(claims: JwtClaims | null): string[] {
  if (!claims) {
    return [];
  }

  const candidates = [
    claims["roles"],
    claims["role"],
    claims["authorities"],
    claims["scope"],
    claims["scp"],
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is string => typeof item === "string",
      );
    }
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate.split(/[\s,]+/).filter(Boolean);
    }
  }

  return [];
}

export function extractUsername(
  claims: JwtClaims | null,
  fallback: string,
): string {
  if (claims) {
    const value =
      claims["sub"] ??
      claims["username"] ??
      claims["preferred_username"] ??
      claims["user_name"];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return fallback;
}
