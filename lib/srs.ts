/**
 * SM-2 spaced repetition (PLAN §6.5, CORE-3). Pure and date-injectable so it's
 * fully unit-testable. `due` is an ISO date string ("YYYY-MM-DD"); intervals are
 * whole days.
 *
 * Quality mapping (PLAN §6.5): first-try correct = 5, correct with hint = 4,
 * correct on second try = 3, wrong = 1. q < 3 is a lapse.
 */

export type Quality = 1 | 3 | 4 | 5;

/** The schedulable state of a card (mirrors srs_cards columns minus refs). */
export interface SrsState {
  ef: number;
  intervalD: number;
  reps: number;
  lapses: number;
}

export interface SrsSchedule extends SrsState {
  due: string; // ISO date
}

export const EF_FLOOR = 1.3;
export const INITIAL: SrsState = { ef: 2.5, intervalD: 0, reps: 0, lapses: 0 };

export function mapQuality(o: {
  correct: boolean;
  usedHint?: boolean;
  secondTry?: boolean;
}): Quality {
  if (!o.correct) return 1;
  if (o.secondTry) return 3;
  if (o.usedHint) return 4;
  return 5;
}

/** Add whole days to an ISO date, staying in UTC to avoid DST/timezone drift. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function review(prev: SrsState, quality: Quality, today: string): SrsSchedule {
  let reps: number;
  let intervalD: number;
  let lapses = prev.lapses;

  if (quality < 3) {
    reps = 0;
    intervalD = 1;
    lapses += 1;
  } else {
    intervalD =
      prev.reps === 0 ? 1 : prev.reps === 1 ? 6 : Math.round(prev.intervalD * prev.ef);
    reps = prev.reps + 1;
  }

  // EF update applies for every grade (PLAN §6.5), floored at EF_FLOOR.
  const ef = Math.max(
    EF_FLOOR,
    prev.ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );

  return { ef, intervalD, reps, lapses, due: addDays(today, intervalD) };
}
