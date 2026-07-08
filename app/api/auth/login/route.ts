import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { verifyCredentials } from "@/lib/auth/login";
import { getAuthSecret } from "@/lib/auth/secret";
import {
  createSessionToken,
  DEFAULT_TTL_SECONDS,
  SESSION_COOKIE,
} from "@/lib/auth/session";

const body = z.object({ name: z.string().min(1), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("bad_request", "请输入用户名和密码", 400);

  const user = verifyCredentials(parsed.data.name, parsed.data.password);
  if (!user) return apiError("invalid_credentials", "用户名或密码不对", 401);
  const token = createSessionToken(user, {
    secret: getAuthSecret(),
    now: Math.floor(Date.now() / 1000),
  });
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEFAULT_TTL_SECONDS,
  });
  return res;
}
