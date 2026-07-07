/**
 * Read-side queries for grammar lessons (server components + route handlers).
 */
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, grammarPoints, sentences } from "@/drizzle/schema";
import type { Exercise, GrammarPoint, Sentence } from "@/drizzle/schema";

export interface GrammarLessonView {
  point: GrammarPoint;
  exercises: Exercise[];
  sentences: Sentence[];
}

export function getGrammarLesson(code: string): GrammarLessonView | null {
  const point = db.select().from(grammarPoints).where(eq(grammarPoints.code, code)).get();
  if (!point) return null;
  return {
    point,
    exercises: db
      .select()
      .from(exercises)
      .where(eq(exercises.gpId, point.id))
      .orderBy(asc(exercises.uid))
      .all(),
    sentences: db
      .select()
      .from(sentences)
      .where(eq(sentences.packId, code))
      .orderBy(asc(sentences.uid))
      .all(),
  };
}

export function getExerciseById(id: number): Exercise | undefined {
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}
