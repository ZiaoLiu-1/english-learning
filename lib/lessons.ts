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

/** Client-safe exercise shape — the answer key is never sent to the browser. */
export interface ClientExercise {
  id: number;
  uid: string;
  type: string;
  payloadJson: unknown;
  explainZh: string | null;
}

/**
 * cloze answers live in payload.blanks[].accept; strip them (keep only the
 * blank count). mcq/correct payloads carry no answer (that's in answerJson,
 * which we already never send).
 */
export function stripExerciseAnswers(type: string, payload: unknown): unknown {
  if (type !== "cloze") return payload;
  const p = payload as { text: string; blanks: unknown[] };
  return { text: p.text, blanks: p.blanks.map(() => ({ accept: [] as string[] })) };
}

export function toClientExercise(e: Exercise): ClientExercise {
  return {
    id: e.id,
    uid: e.uid,
    type: e.type,
    payloadJson: stripExerciseAnswers(e.type, e.payloadJson),
    explainZh: e.explainZh,
  };
}
