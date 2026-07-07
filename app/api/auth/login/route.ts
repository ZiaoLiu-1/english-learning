import { NextResponse } from "next/server";
import { z } from "zod";
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
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "bad_request", message_zh: "请输入用户名和密码" } },
      { status: 400 },
    );
  }
  const user = verifyCredentials(parsed.data.name, parsed.data.password);
  if (!user) {
    return NextResponse.json(
      { error: { code: "invalid_credentials", message_zh: "用户名或密码不对" } },
      { status: 401 },
    );
  }
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
