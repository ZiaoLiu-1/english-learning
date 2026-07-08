import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { completePlanItem } from "@/lib/daily";

const body = z.object({ key: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("unauthorized", "请先登录", 401);

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("bad_request", "参数不对", 400);

  return NextResponse.json({ done: completePlanItem(user.uid, parsed.data.key) });
}
