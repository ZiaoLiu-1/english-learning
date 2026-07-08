import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getTodayPlan } from "@/lib/daily";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("unauthorized", "请先登录", 401);
  return NextResponse.json(getTodayPlan(user.uid));
}
