/**
 * Client-side shapes for a lesson's exercises/sentences. Deliberately omit the
 * answer key — grading happens server-side (POST /api/exercises/submit). That
 * means answerJson is never sent, AND cloze `accept` lists are stripped (the
 * client only needs the blank count to render inputs).
 */
import type { AltRule } from "@/lib/content/schema";

export interface McqPayload {
  question: string;
  options: string[];
}

export interface ClozePayload {
  text: string;
  /** answers stripped; length = number of inputs to render */
  blanks: { accept: string[] }[];
}

export interface CorrectPayload {
  tokens: string[];
}

export interface ExerciseView {
  id: number;
  uid: string;
  type: "mcq" | "cloze" | "correct" | string;
  payloadJson: unknown;
  explainZh: string | null;
}

export interface SentenceView {
  id: number;
  uid: string;
  en: string;
  zh: string;
  tokensJson: string[];
  alt: AltRule[];
  audioPath: string | null;
}
