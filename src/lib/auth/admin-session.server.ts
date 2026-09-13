const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const ADMIN_SESSION_COOKIE = "__Host-kaheng-admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type AdminSessionPayload = {
  username: string;
  expiresAt: number;
};

export type AdminAuthConfig = {
  username: string;
  password: string;
  sessionSecret: string;
};

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

/**
 * Credentials stay on the server. ADMIN_EMAIL is accepted as a temporary
 * username fallback so an existing deployment can migrate without a code
 * change; new deployments should use ADMIN_USERNAME.
 */
export function getAdminAuthConfig(): AdminAuthConfig | null {
  const username = readEnv("ADMIN_USERNAME") ?? readEnv("ADMIN_EMAIL");
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;

  return {
    username,
    password,
    sessionSecret:
      readEnv("ADMIN_SESSION_SECRET") ??
      readEnv("BETTER_AUTH_SECRET") ??
      password,
  };
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = textEncoder.encode(left);
  const rightBytes = textEncoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let i = 0; i < length; i += 1) {
    difference |= (leftBytes[i] ?? 0) ^ (rightBytes[i] ?? 0);
  }
  return difference === 0;
}

async function signPayload(secret: string, payload: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto API is unavailable");

  const key = await subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await subtle.sign("HMAC", key, textEncoder.encode(payload));
  return encodeBase64Url(new Uint8Array(signature));
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const config = getAdminAuthConfig();
  if (!config) return false;

  const usernameMatches = constantTimeEqual(username, config.username);
  const passwordMatches = constantTimeEqual(password, config.password);
  return usernameMatches && passwordMatches;
}

export async function createAdminSession(username: string): Promise<string> {
  const config = getAdminAuthConfig();
  if (!config || !constantTimeEqual(username, config.username)) {
    throw new Error("Admin authentication is not configured");
  }

  const payload = encodeBase64Url(
    textEncoder.encode(
      JSON.stringify({
        username: config.username,
        expiresAt: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
      } satisfies AdminSessionPayload),
    ),
  );
  const signature = await signPayload(config.sessionSecret, payload);
  return payload + "." + signature;
}

export async function getAdminSessionUsername(
  token: string | undefined,
): Promise<string | null> {
  const config = getAdminAuthConfig();
  if (!config || !token || token.length > 2048) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const payloadPart = parts[0];
  const signaturePart = parts[1];
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = await signPayload(config.sessionSecret, payloadPart);
  if (!constantTimeEqual(signaturePart, expectedSignature)) return null;

  const encodedPayload = decodeBase64Url(payloadPart);
  if (!encodedPayload) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(textDecoder.decode(encodedPayload));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const payload = parsed as Partial<AdminSessionPayload>;
  if (
    typeof payload.username !== "string" ||
    typeof payload.expiresAt !== "number" ||
    !Number.isSafeInteger(payload.expiresAt) ||
    payload.expiresAt <= Math.floor(Date.now() / 1000) ||
    !constantTimeEqual(payload.username, config.username)
  ) {
    return null;
  }

  return payload.username;
}

function serializeAdminCookie(value: string, maxAge: number): string {
  return [
    ADMIN_SESSION_COOKIE + "=" + encodeURIComponent(value),
    "Max-Age=" + maxAge,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

export function serializeAdminSessionCookie(token: string): string {
  return serializeAdminCookie(token, ADMIN_SESSION_MAX_AGE);
}

export function serializeAdminSessionClearCookie(): string {
  return serializeAdminCookie("", 0);
}
