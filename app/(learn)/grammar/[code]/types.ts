/**
 * Client-side shapes for a lesson's exercises/sentences. Deliberately omit
 * answerJson — grading happens server-side (POST /api/exercises/submit);
 * the client never needs the answer key.
 */

export interface McqPayload {
  question: string;
  options: string[];
}

export interface ClozePayload {
  text: string;
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
  audioPath: string | null;
}
