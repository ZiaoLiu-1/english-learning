import { cookies } from "next/headers";
import { getAuthSecret } from "@/lib/auth/secret";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionUser,
} from "@/lib/auth/session";

/** Read + verify the session cookie in a Server Component / route handler. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token, {
    secret: getAuthSecret(),
    now: Math.floor(Date.now() / 1000),
  });
}
