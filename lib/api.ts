import { NextResponse } from "next/server";

/** Uniform API error shape (CLAUDE §9): { error: { code, message_zh } }. */
export function apiError(code: string, messageZh: string, status: number) {
  return NextResponse.json({ error: { code, message_zh: messageZh } }, { status });
}
