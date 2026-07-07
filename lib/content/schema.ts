/**
 * Zod schemas for all content files — the single contract shared by
 * `pnpm content:validate`, `pnpm seed`, the admin import API, and the
 * content-drafter prompt (content/prompts/content_draft.md).
 *
 * Codes are zero-padded everywhere: L01..L42, P01..P11.
 */
import { z } from "zod";

export const LESSON_CODE_RE = /^L(0[1-9]|[1-3][0-9]|4[0-2])$/;
export const PHONICS_CODE_RE = /^P(0[1-9]|1[01])$/;

export const lessonCode = z.string().regex(LESSON_CODE_RE, "expected L01..L42");
export const phonicsCode = z.string().regex(PHONICS_CODE_RE, "expected P01..P11");

export const contentStatus = z.enum(["draft", "approved"]);

// ---------- grammar lesson markdown (content/grammar/LNN.md) ----------

export const grammarFrontmatter = z.object({
  lesson: lessonCode,
  status: contentStatus,
  stage: z.number().int().min(1).max(4),
  ord: z.number().int().min(1).max(42),
  title_zh: z.string().min(1),
  prereq: z.array(lessonCode).default([]),
});
export type GrammarFrontmatter = z.infer<typeof grammarFrontmatter>;

// ---------- exercises (content/grammar/LNN.exercises.json) ----------

const exerciseBase = z.object({
  uid: z.string().min(1),
  difficulty: z.number().int().min(1).max(3).default(1),
  explain_zh: z
    .string()
    .min(8, "explain_zh must actually explain, not just restate the answer"),
});

export const mcqExercise = exerciseBase.extend({
  type: z.literal("mcq"),
  payload: z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(3).max(5),
  }),
  answer: z.object({ index: z.number().int().min(0) }),
});

export const clozeExercise = exerciseBase.extend({
  type: z.literal("cloze"),
  payload: z.object({
    // blanks are written as ___ (3+ underscores), one per entry in `blanks`
    text: z.string().min(1),
    blanks: z
      .array(z.object({ accept: z.array(z.string().min(1)).min(1) }))
      .min(1),
  }),
  answer: z.object({}).strict().default({}), // accepted answers live in payload.blanks
});

export const correctExercise = exerciseBase.extend({
  type: z.literal("correct"),
  payload: z.object({
    tokens: z.array(z.string().min(1)).min(2),
  }),
  answer: z.object({
    error_index: z.number().int().min(0),
    corrections: z.array(z.string().min(1)).min(1),
  }),
});

export const minimalPairExercise = exerciseBase.extend({
  type: z.literal("minimal_pair"),
  payload: z.object({
    audio_text: z.string().min(1), // the word actually spoken
    options: z.array(z.string().min(1)).length(2),
  }),
  answer: z.object({ index: z.number().int().min(0).max(1) }),
});

export const exercise = z.discriminatedUnion("type", [
  mcqExercise,
  clozeExercise,
  correctExercise,
  minimalPairExercise,
]);
export type ContentExercise = z.infer<typeof exercise>;

export const exercisesFile = z.object({
  lesson: lessonCode,
  status: contentStatus,
  exercises: z.array(exercise).min(1),
});
export type ExercisesFile = z.infer<typeof exercisesFile>;

// ---------- sentence packs (content/sentences/pack-LNN.json, daily-300.json) ----------

/**
 * `alt` equivalence rule: tokens[span[0]..span[1]) may be replaced by any of
 * `options` (each an alternative token run). Global contractions (don't ↔ do
 * not) are handled in lib/tokenize.ts; use alt only for sentence-specific
 * equivalents.
 */
export const altRule = z.object({
  span: z.tuple([z.number().int().min(0), z.number().int().min(1)]),
  options: z.array(z.array(z.string().min(1)).min(1)).min(1),
});
export type AltRule = z.infer<typeof altRule>;

export const packSentence = z.object({
  uid: z.string().min(1),
  en: z.string().min(1),
  zh: z.string().min(1),
  tokens: z.array(z.string().min(1)).min(1),
  alt: z.array(altRule).default([]),
  gp_codes: z.array(lessonCode).default([]),
  level: z.number().int().min(1).max(3).default(1),
});
export type PackSentence = z.infer<typeof packSentence>;

export const sentencePack = z.object({
  pack: z.union([lessonCode, z.literal("daily-300")]),
  status: contentStatus,
  sentences: z.array(packSentence).min(1),
});
export type SentencePack = z.infer<typeof sentencePack>;

// ---------- cross-field checks shared by validate + import ----------

export interface ContentIssue {
  file: string;
  ref: string; // uid or section that the issue points at
  message: string;
}

const CLOZE_BLANK_RE = /_{3,}/g;

export function checkExercise(ex: ContentExercise, file: string): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const at = (message: string) => issues.push({ file, ref: ex.uid, message });

  switch (ex.type) {
    case "mcq":
    case "minimal_pair":
      if (ex.answer.index >= ex.payload.options.length) {
        at(`answer.index ${ex.answer.index} out of range for ${ex.payload.options.length} options`);
      }
      if (new Set(ex.payload.options.map((o) => o.trim().toLowerCase())).size !== ex.payload.options.length) {
        at("duplicate options");
      }
      break;
    case "cloze": {
      const blanks = ex.payload.text.match(CLOZE_BLANK_RE)?.length ?? 0;
      if (blanks !== ex.payload.blanks.length) {
        at(`text has ${blanks} blank markers (___) but blanks[] has ${ex.payload.blanks.length}`);
      }
      break;
    }
    case "correct":
      if (ex.answer.error_index >= ex.payload.tokens.length) {
        at(`error_index ${ex.answer.error_index} out of range for ${ex.payload.tokens.length} tokens`);
      }
      break;
  }
  return issues;
}

export function checkSentence(s: PackSentence, file: string): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const rule of s.alt) {
    const [start, end] = rule.span;
    if (end <= start || end > s.tokens.length) {
      issues.push({
        file,
        ref: s.uid,
        message: `alt span [${start},${end}) invalid for ${s.tokens.length} tokens`,
      });
    }
  }
  return issues;
}
