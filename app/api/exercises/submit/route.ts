import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { attempts } from "@/drizzle/schema";
import { getExerciseById } from "@/lib/lessons";
import { SubmissionError, judgeSubmission } from "@/lib/exercise-submit";
import { scheduleFromAttempt } from "@/lib/review";

const body = z.object({
  exercise_id: z.number().int().positive(),
  response: z.unknown(),
  used_hint: z.boolean().default(false),
  ms_used: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("unauthorized", "请先登录", 401);

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("bad_request", "提交内容格式不对", 400);

  const exercise = getExerciseById(parsed.data.exercise_id);
  if (!exercise) return apiError("not_found", "题目不存在", 404);

  let result;
  try {
    result = judgeSubmission(exercise, parsed.data.response);
  } catch (e) {
    if (e instanceof SubmissionError) return apiError("bad_response", "答案格式不对", 400);
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

  // Enter/advance the SRS schedule for this exercise (PLAN §5G CORE-3).
  scheduleFromAttempt(user.uid, exercise.id, {
    correct: result.correct,
    usedHint: parsed.data.used_hint,
  });

  return NextResponse.json({ result, explain_zh: exercise.explainZh });
}
