/**
 * Lesson-directory read model: merges the 42-lesson curriculum skeleton
 * (lib/curriculum) with what's actually seeded (grammar_points) and the user's
 * attempts, into a per-stage structure the directory page renders.
 *
 * status:
 *   - "available": lesson is seeded and learnable
 *   - "coming":    on the syllabus but not authored/approved yet
 * A lesson is "completed" when every exercise has at least one correct attempt,
 * "in_progress" when some exercises have been attempted, else "new".
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, exercises, grammarPoints } from "@/drizzle/schema";
import { CURRICULUM, STAGES, type CurriculumStage } from "@/lib/curriculum";

export type LessonStatus = "available" | "coming";
export type LessonState = "new" | "in_progress" | "completed";

export interface LessonProgress {
  code: string;
  ord: number;
  title: string;
  status: LessonStatus;
  state: LessonState;
  total: number; // exercise count (0 if not seeded)
  attempted: number; // distinct exercises attempted
  correct: number; // distinct exercises with a correct attempt
}

export interface StageProgress extends CurriculumStage {
  lessons: LessonProgress[];
  availableCount: number;
}

export interface CurriculumProgress {
  stages: StageProgress[];
  totals: { lessons: number; available: number; completed: number };
}

export function getCurriculumProgress(userId: number): CurriculumProgress {
  const seeded = new Map(
    db
      .select({ id: grammarPoints.id, code: grammarPoints.code, titleZh: grammarPoints.titleZh })
      .from(grammarPoints)
      .all()
      .map((r) => [r.code, r]),
  );

  const gpIdByCode = new Map([...seeded.values()].map((r) => [r.code, r.id]));
  const exRows = db.select({ id: exercises.id, gpId: exercises.gpId }).from(exercises).all();
  const totalByGp = new Map<number, number>();
  const gpByExercise = new Map<number, number>();
  for (const e of exRows) {
    if (e.gpId == null) continue;
    totalByGp.set(e.gpId, (totalByGp.get(e.gpId) ?? 0) + 1);
    gpByExercise.set(e.id, e.gpId);
  }

  const atRows = db
    .select({ exerciseId: attempts.exerciseId, correct: attempts.correct })
    .from(attempts)
    .where(eq(attempts.userId, userId))
    .all();
  const attemptedByGp = new Map<number, Set<number>>();
  const correctByGp = new Map<number, Set<number>>();
  for (const a of atRows) {
    const gpId = gpByExercise.get(a.exerciseId);
    if (gpId == null) continue;
    (attemptedByGp.get(gpId) ?? attemptedByGp.set(gpId, new Set()).get(gpId)!).add(a.exerciseId);
    if (a.correct) {
      (correctByGp.get(gpId) ?? correctByGp.set(gpId, new Set()).get(gpId)!).add(a.exerciseId);
    }
  }

  let completedTotal = 0;
  const stages: StageProgress[] = STAGES.map((s) => {
    const lessons: LessonProgress[] = CURRICULUM.filter((c) => c.stage === s.stage).map((c) => {
      const gp = seeded.get(c.code);
      const gpId = gpIdByCode.get(c.code);
      const total = gpId != null ? (totalByGp.get(gpId) ?? 0) : 0;
      const attempted = gpId != null ? (attemptedByGp.get(gpId)?.size ?? 0) : 0;
      const correct = gpId != null ? (correctByGp.get(gpId)?.size ?? 0) : 0;
      const status: LessonStatus = gp ? "available" : "coming";
      const state: LessonState =
        total > 0 && correct >= total ? "completed" : attempted > 0 ? "in_progress" : "new";
      if (state === "completed") completedTotal++;
      return {
        code: c.code,
        ord: c.ord,
        title: gp?.titleZh ?? c.title,
        status,
        state,
        total,
        attempted,
        correct,
      };
    });
    return {
      ...s,
      lessons,
      availableCount: lessons.filter((l) => l.status === "available").length,
    };
  });

  return {
    stages,
    totals: {
      lessons: CURRICULUM.length,
      available: seeded.size,
      completed: completedTotal,
    },
  };
}
