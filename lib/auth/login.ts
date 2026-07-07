import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import type { SessionUser } from "@/lib/auth/session";

/** Verify a name/password against the users table. Null on any mismatch. */
export function verifyCredentials(name: string, password: string): SessionUser | null {
  const row = db.select().from(users).where(eq(users.name, name)).get();
  if (!row) return null;
  if (!bcrypt.compareSync(password, row.pwHash)) return null;
  return { uid: row.id, name: row.name, role: row.role };
}
