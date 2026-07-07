/**
 * Pure judging for MCQ / cloze / 改错 (PLAN §5B GRAM-2).
 * Sentence-construction judging lives in lib/tokenize.ts.
 * All text comparison is case/punctuation-insensitive and
 * contraction-insensitive (canonicalizeContractions).
 */
import { canonicalizeContractions, normalizeText } from "@/lib/tokenize";

export interface McqAnswer {
  index: number;
}

export interface ClozeBlank {
  accept: string[];
}

export interface CorrectAnswer {
  error_index: number;
  corrections: string[];
}

export interface CorrectResponse {
  index: number;
  text: string;
}

function equivalent(a: string, b: string): boolean {
  if (normalizeText(a) === normalizeText(b)) return true;
  return canonicalizeContractions(a) === canonicalizeContractions(b);
}

export function judgeMcq(answer: McqAnswer, chosenIndex: number): { correct: boolean } {
  return { correct: chosenIndex === answer.index };
}

export function judgeCloze(
  blanks: ClozeBlank[],
  responses: string[],
): { correct: boolean; blanks: boolean[] } {
  const results = blanks.map((blank, i) => {
    const response = responses[i] ?? "";
    return blank.accept.some((a) => equivalent(a, response));
  });
  return { correct: results.every(Boolean), blanks: results };
}

/**
 * Two-part judging (PLAN §5B): find the wrong token (50%) + fix it (50%).
 * A fix can only be evaluated at the right position — wrong position scores 0.
 */
export function judgeCorrect(
  answer: CorrectAnswer,
  response: CorrectResponse,
): {
  correct: boolean;
  positionCorrect: boolean;
  correctionCorrect: boolean;
  score: 0 | 0.5 | 1;
} {
  const positionCorrect = response.index === answer.error_index;
  const correctionCorrect =
    positionCorrect && answer.corrections.some((c) => equivalent(c, response.text));
  const score = positionCorrect ? (correctionCorrect ? 1 : 0.5) : 0;
  return { correct: score === 1, positionCorrect, correctionCorrect, score };
}
