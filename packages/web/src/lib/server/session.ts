import { createHmac, timingSafeEqual } from "node:crypto";

export interface SessionUser {
  id: string;
  username: string;
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value)
    throw new Error("Missing required environment variable: SESSION_SECRET");
  return value;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

// Stateless session token: base64url(payload).hmac — no server-side store.
export function signSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string): SessionUser | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
