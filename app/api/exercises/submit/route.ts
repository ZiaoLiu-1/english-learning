import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { attempts } from "@/drizzle/schema";
import { getExerciseById } from "@/lib/lessons";
import { SubmissionError, judgeSubmission } from "@/lib/exercise-submit";

const body = z.object({
  exercise_id: z.number().int().positive(),
  response: z.unknown(),
  used_hint: z.boolean().default(false),
  ms_used: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message_zh: "请先登录" } },
      { status: 401 },
    );
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "bad_request", message_zh: "提交内容格式不对" } },
      { status: 400 },
    );
  }
  const exercise = getExerciseById(parsed.data.exercise_id);
  if (!exercise) {
    return NextResponse.json(
      { error: { code: "not_found", message_zh: "题目不存在" } },
      { status: 404 },
    );
  }

  let result;
  try {
    result = judgeSubmission(exercise, parsed.data.response);
  } catch (e) {
    if (e instanceof SubmissionError) {
      return NextResponse.json(
        { error: { code: "bad_response", message_zh: "答案格式不对" } },
        { status: 400 },
      );
    }
    throw e;
  }

  db.insert(attempts)
    .values({
      userId: user.uid,
      exerciseId: exercise.id,
      responseJson: parsed.data.response,
      correct: result.correct,
      usedHint: parsed.data.used_hint,
      msUsed: parsed.data.ms_used,
    })
    .run();

  return NextResponse.json({ result, explain_zh: exercise.explainZh });
}
