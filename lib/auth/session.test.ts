import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken, type SessionUser } from "@/lib/auth/session";

const secret = "test-secret-please-change";
const user: SessionUser = { uid: 7, name: "learner", role: "learner" };

// Fixed clock so tests never touch Date.now() ambiguously.
const now = 1_700_000_000; // seconds

/** Sign an arbitrary payload string the same way the module does. */
function signRaw(payload: string): string {
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", secret).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

describe("session token sign/verify", () => {
  it("round-trips a valid token", () => {
    const token = createSessionToken(user, { secret, now, ttlSeconds: 3600 });
    const result = verifySessionToken(token, { secret, now });
    expect(result).toEqual(user);
  });

  it("returns null for a tampered payload", () => {
    const token = createSessionToken(user, { secret, now, ttlSeconds: 3600 });
    const [payload, sig] = token.split(".");
    // flip a byte in the payload, keep the old signature
    const forged = payload.slice(0, -1) + (payload.at(-1) === "A" ? "B" : "A") + "." + sig;
    expect(verifySessionToken(forged, { secret, now })).toBeNull();
  });

  it("returns null when signed with a different secret", () => {
    const token = createSessionToken(user, { secret, now, ttlSeconds: 3600 });
    expect(verifySessionToken(token, { secret: "other-secret", now })).toBeNull();
  });

  it("returns null once expired", () => {
    const token = createSessionToken(user, { secret, now, ttlSeconds: 100 });
    expect(verifySessionToken(token, { secret, now: now + 101 })).toBeNull();
    // still valid one second before expiry
    expect(verifySessionToken(token, { secret, now: now + 99 })).toEqual(user);
  });

  it("uses the 30-day default TTL when none is given", () => {
    const token = createSessionToken(user, { secret, now });
    const almost = now + 60 * 60 * 24 * 30 - 1;
    expect(verifySessionToken(token, { secret, now: almost })).toEqual(user);
    expect(verifySessionToken(token, { secret, now: almost + 2 })).toBeNull();
  });

  it("returns null for structurally malformed tokens", () => {
    for (const bad of ["", "nodot", "a.b.c", ".", "x."]) {
      expect(verifySessionToken(bad, { secret, now })).toBeNull();
    }
  });

  it("rejects a correctly-signed payload that isn't valid JSON", () => {
    expect(verifySessionToken(signRaw("not json{"), { secret, now })).toBeNull();
  });

  it("rejects a correctly-signed payload with the wrong shape", () => {
    expect(verifySessionToken(signRaw(JSON.stringify({ foo: 1 })), { secret, now })).toBeNull();
    // valid user fields but no exp
    const noExp = JSON.stringify({ uid: 1, name: "x", role: "learner" });
    expect(verifySessionToken(signRaw(noExp), { secret, now })).toBeNull();
  });
});
