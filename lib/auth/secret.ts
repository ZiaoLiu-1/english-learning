/**
 * Session signing secret. Required in production; a fixed dev fallback keeps
 * local `pnpm dev` frictionless (same spirit as seed's dev passwords).
 */
let warned = false;

export function getAuthSecret(): string {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set (>=16 chars) in production");
  }
  if (!warned) {
    console.warn("[auth] AUTH_SECRET unset — using insecure dev fallback");
    warned = true;
  }
  return "dev-only-insecure-secret-do-not-ship";
}
