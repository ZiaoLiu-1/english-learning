/**
 * Stateless session tokens: an HMAC-SHA256-signed (not encrypted) payload in an
 * httpOnly cookie. Two fixed accounts (PLAN §5H SYS-1) don't warrant a JWT
 * dependency; the payload is non-secret (uid/name/role) so signing — proving we
 * issued it and it hasn't been tampered — is all we need.
 *
 * Pure and clock-injectable so it's fully unit-testable without Date.now().
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const sessionUser = z.object({
  uid: z.number().int().positive(),
  name: z.string().min(1),
  role: z.enum(["admin", "learner"]),
});
export type SessionUser = z.infer<typeof sessionUser>;

const payloadSchema = sessionUser.extend({ exp: z.number().int().positive() });

export const SESSION_COOKIE = "session";
export const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface SignOpts {
  secret: string;
  now: number; // epoch seconds
  ttlSeconds?: number;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function createSessionToken(user: SessionUser, opts: SignOpts): string {
  const payload = { ...user, exp: opts.now + (opts.ttlSeconds ?? DEFAULT_TTL_SECONDS) };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  return `${payloadB64}.${sign(payloadB64, opts.secret)}`;
}

export function verifySessionToken(
  token: string,
  opts: { secret: string; now: number },
): SessionUser | null {
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (sig.length === 0) return null;

  const expected = sign(payloadB64, opts.secret);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) return null;
  if (parsed.data.exp <= opts.now) return null;

  return { uid: parsed.data.uid, name: parsed.data.name, role: parsed.data.role };
}
