/**
 * Daily plan generator (PLAN §5G CORE-2). Pure rule engine: given today's
 * state, produce an ordered list of task cards. Fully unit-testable.
 *
 * Current task kinds: review (SRS) + grammar (next lesson). phonics / dictation
 * / sentence are reserved — their rules slot in here as that content lands, so
 * the plan naturally grows toward the ~150-min daily target (PLAN §8).
 */

export type TaskKind = "review" | "grammar" | "phonics" | "dictation" | "sentence";

export interface PlanItem {
  kind: TaskKind;
  refId?: string; // e.g. lesson code "L04"
  minutes: number;
  title: string;
}

export interface PlanInput {
  weekNo: number; // reserved: phonics/listening scheduling depends on the week
  dueCount: number; // SRS cards due today
  nextGrammarCode: string | null; // next unlearned available lesson, or null
  yesterdayCompletion: number | null; // 0..1, or null if there was no yesterday
  targetMinutes?: number; // default 150
}

export interface DailyPlan {
  items: PlanItem[];
  totalMinutes: number;
  targetMinutes: number;
}

const DEFAULT_TARGET_MINUTES = 150;
const REVIEW_BACKLOG_THRESHOLD = 40; // > this ⇒ longer review block (PLAN §5G)
const CRASH_GUARD_FACTOR = 0.8; // yesterday < 60% ⇒ scale today down (防崩盘)
const CRASH_GUARD_THRESHOLD = 0.6;

export function generatePlan(input: PlanInput): DailyPlan {
  const items: PlanItem[] = [];

  // 1) SRS review first (PLAN daily template).
  if (input.dueCount > 0) {
    items.push({
      kind: "review",
      minutes: input.dueCount > REVIEW_BACKLOG_THRESHOLD ? 25 : 15,
      title: `复习 ${input.dueCount} 张到期卡片`,
    });
  }

  // 2) The next grammar lesson.
  if (input.nextGrammarCode) {
    items.push({
      kind: "grammar",
      refId: input.nextGrammarCode,
      minutes: 30,
      title: `学新课 ${input.nextGrammarCode}`,
    });
  }

  // 3) Crash guard: after a weak day, dial the whole load back so she doesn't
  //    bounce off (PLAN §5G).
  const scaled =
    input.yesterdayCompletion !== null && input.yesterdayCompletion < CRASH_GUARD_THRESHOLD
      ? items.map((i) => ({ ...i, minutes: Math.round(i.minutes * CRASH_GUARD_FACTOR) }))
      : items;

  return {
    items: scaled,
    totalMinutes: scaled.reduce((sum, i) => sum + i.minutes, 0),
    targetMinutes: input.targetMinutes ?? DEFAULT_TARGET_MINUTES,
  };
}
