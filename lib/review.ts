/**
 * Review read/write layer: turns exercise attempts into SRS cards and serves
 * the due-review queue and the error book (PLAN §5G CORE-3, §5B GRAM-4).
 *
 * - Every answered exercise gets one SRS card (unique per user+exercise), so
 *   re-answering the same item reschedules the same card (natural 24h dedup).
 * - The review queue = cards due today; answering them goes back through
 *   /api/exercises/submit, which reschedules the card.
 * - The error book is derived from attempts (exercises with any wrong attempt),
 *   grouped by grammar point — independent of the SRS schedule.
 */
import { and, asc, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, exercises, grammarPoints, srsCards } from "@/drizzle/schema";
import {
  INITIAL,
  mapQuality,
  review,
  type Quality,
  type SrsState,
} from "@/lib/srs";
import { toClientExercise, type ClientExercise } from "@/lib/lessons";

const REVIEW_REF = "exercise" as const;
export const DAILY_REVIEW_CAP = 60;

/** Local calendar date as ISO "YYYY-MM-DD" (day granularity for SRS due). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Create or reschedule the SRS card for an answered exercise. */
export function recordExerciseReview(
  userId: number,
  exerciseId: number,
  quality: Quality,
  today: string,
): void {
  const refId = String(exerciseId);
  const existing = db
    .select()
    .from(srsCards)
    .where(
      and(
        eq(srsCards.userId, userId),
        eq(srsCards.refType, REVIEW_REF),
        eq(srsCards.refId, refId),
      ),
    )
    .get();

  const prev: SrsState = existing
    ? { ef: existing.ef, intervalD: existing.intervalD, reps: existing.reps, lapses: existing.lapses }
    : INITIAL;
  const next = review(prev, quality, today);

  if (existing) {
    db.update(srsCards).set(next).where(eq(srsCards.id, existing.id)).run();
  } else {
    db.insert(srsCards)
      .values({ userId, refType: REVIEW_REF, refId, ...next })
      .run();
  }
}

/** Convenience wrapper used by the submit route. */
export function scheduleFromAttempt(
  userId: number,
  exerciseId: number,
  o: { correct: boolean; usedHint?: boolean; secondTry?: boolean },
  today = todayISO(),
): void {
  recordExerciseReview(userId, exerciseId, mapQuality(o), today);
}

export function getDueCount(userId: number, today = todayISO()): number {
  return db
    .select()
    .from(srsCards)
    .where(
      and(
        eq(srsCards.userId, userId),
        eq(srsCards.refType, REVIEW_REF),
        lte(srsCards.due, today),
      ),
    )
    .all().length;
}

/** Exercises due for review today (answer-key stripped), capped and ordered. */
export function getDueExercises(userId: number, today = todayISO()): ClientExercise[] {
  const cards = db
    .select({ refId: srsCards.refId })
    .from(srsCards)
    .where(
      and(
        eq(srsCards.userId, userId),
        eq(srsCards.refType, REVIEW_REF),
        lte(srsCards.due, today),
      ),
    )
    .orderBy(asc(srsCards.due))
    .limit(DAILY_REVIEW_CAP)
    .all();

  const ids = cards.map((c) => Number(c.refId));
  if (ids.length === 0) return [];
  const rows = db.select().from(exercises).where(inArray(exercises.id, ids)).all();
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((e) => e != null).map(toClientExercise);
}

export interface ErrorBookGroup {
  code: string;
  title: string;
  wrongCount: number; // distinct exercises with a wrong attempt
  exercises: { id: number; uid: string; type: string }[];
}

/** Distinct exercises the user has gotten wrong, grouped by grammar point. */
export function getErrorBook(userId: number): ErrorBookGroup[] {
  const wrong = db
    .selectDistinct({ exerciseId: attempts.exerciseId })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.correct, false)))
    .all();
  if (wrong.length === 0) return [];

  const wrongIds = wrong.map((w) => w.exerciseId);
  const exRows = db.select().from(exercises).where(inArray(exercises.id, wrongIds)).all();
  const gps = new Map(
    db
      .select({ id: grammarPoints.id, code: grammarPoints.code, title: grammarPoints.titleZh })
      .from(grammarPoints)
      .all()
      .map((g) => [g.id, g]),
  );

  const groups = new Map<number, ErrorBookGroup>();
  for (const e of exRows) {
    if (e.gpId == null) continue;
    const gp = gps.get(e.gpId);
    if (!gp) continue;
    let g = groups.get(e.gpId);
    if (!g) {
      g = { code: gp.code, title: gp.title, wrongCount: 0, exercises: [] };
      groups.set(e.gpId, g);
    }
    g.wrongCount += 1;
    g.exercises.push({ id: e.id, uid: e.uid, type: e.type });
  }
  return [...groups.values()].sort((a, b) => a.code.localeCompare(b.code));
}
