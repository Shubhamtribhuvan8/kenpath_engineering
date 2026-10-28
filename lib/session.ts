import type { Officer } from "@/lib/types";

export const SESSION_COOKIE = "nivada_session";
const SESSION_MS = 12 * 60 * 60 * 1000;

type TokenPayload = Officer & { exp: number };

function secret(): string {
  const value = process.env.NIVADA_SESSION_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NIVADA_SESSION_SECRET is required in production");
  }
  return "local-dev-only-session-secret";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function equalText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function signSession(user: Officer): Promise<string> {
  const payload: TokenPayload = { ...user, exp: Date.now() + SESSION_MS };
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body)}`;
}

export async function readSession(token: string | undefined | null): Promise<Officer | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = await hmac(body);
  if (!equalText(signature, expected)) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(body));
    const payload = JSON.parse(json) as TokenPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.username || !payload.name || !payload.role) return null;
    return { username: payload.username, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MS / 1000) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
