import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDueExercises } from "@/lib/review";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("unauthorized", "请先登录", 401);
  return NextResponse.json({ exercises: getDueExercises(user.uid) });
}
