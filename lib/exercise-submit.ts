/**
 * Dispatch a learner's response to the right judge (lib/exercise-judge) based
 * on a stored exercise row's type. Pure: takes the stored payload/answer JSON
 * and the client response, returns a typed result. The route handler
 * (/api/exercises/submit) wraps this with auth + attempts persistence.
 */
import { z } from "zod";
import {
  judgeCloze,
  judgeCorrect,
  judgeMcq,
  type ClozeBlank,
  type CorrectAnswer,
} from "@/lib/exercise-judge";

export class SubmissionError extends Error {}

export interface JudgeableExercise {
  type: string;
  payloadJson: unknown;
  answerJson: unknown;
}

export type SubmissionResult =
  | { type: "mcq"; correct: boolean }
  | { type: "minimal_pair"; correct: boolean }
  | { type: "cloze"; correct: boolean; blanks: boolean[] }
  | {
      type: "correct";
      correct: boolean;
      positionCorrect: boolean;
      correctionCorrect: boolean;
      score: 0 | 0.5 | 1;
    };

const mcqResponse = z.object({ index: z.number().int().min(0) });
const clozeResponse = z.object({ responses: z.array(z.string()) });
const correctResponse = z.object({ index: z.number().int().min(0), text: z.string() });

function parse<T>(schema: z.ZodType<T>, response: unknown, kind: string): T {
  const r = schema.safeParse(response);
  if (!r.success) throw new SubmissionError(`invalid response for ${kind} exercise`);
  return r.data;
}

export function judgeSubmission(
  ex: JudgeableExercise,
  response: unknown,
): SubmissionResult {
  switch (ex.type) {
    case "mcq":
    case "minimal_pair": {
      const { index } = parse(mcqResponse, response, ex.type);
      const answer = ex.answerJson as { index: number };
      return { type: ex.type, ...judgeMcq(answer, index) };
    }
    case "cloze": {
      const { responses } = parse(clozeResponse, response, ex.type);
      const blanks = (ex.payloadJson as { blanks: ClozeBlank[] }).blanks;
      return { type: "cloze", ...judgeCloze(blanks, responses) };
    }
    case "correct": {
      const { index, text } = parse(correctResponse, response, ex.type);
      return { type: "correct", ...judgeCorrect(ex.answerJson as CorrectAnswer, { index, text }) };
    }
    default:
      throw new SubmissionError(`unsupported exercise type: ${ex.type}`);
  }
}
