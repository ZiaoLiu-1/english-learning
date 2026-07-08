/**
 * Daily plan persistence + inputs (PLAN §5G CORE-2). Wraps the pure engine
 * (lib/plan) with DB reads: figure out today's inputs, generate once, persist
 * to daily_plans (frozen for the day), track per-item completion and streak.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyPlans } from "@/drizzle/schema";
import { generatePlan, type DailyPlan, type PlanItem } from "@/lib/plan";
import { getCurriculumProgress } from "@/lib/progress";
import { getDueCount, todayISO } from "@/lib/review";

/** Stable identity for a plan item, used as the done-key. */
export function itemKey(item: Pick<PlanItem, "kind" | "refId">): string {
  return `${item.kind}:${item.refId ?? ""}`;
}

/** First seeded lesson that isn't completed yet, in curriculum order. */
export function nextGrammarCode(userId: number): string | null {
  const prog = getCurriculumProgress(userId);
  for (const stage of prog.stages) {
    for (const lesson of stage.lessons) {
      if (lesson.status === "available" && lesson.state !== "completed") return lesson.code;
    }
  }
  return null;
}

function completionOf(row: { itemsJson: unknown; doneJson: unknown }): number | null {
  const items = (row.itemsJson as PlanItem[]) ?? [];
  const done = (row.doneJson as string[]) ?? [];
  if (items.length === 0) return null;
  return done.length / items.length;
}

// TODO: derive the real week number from the learner's start date once the
// diagnostic sets it; week 1 is honest for a new learner and unused by the
// engine's current task kinds.
const WEEK_NO = 1;

export interface TodayPlan {
  date: string;
  plan: DailyPlan;
  done: string[];
  streak: number;
  weekNo: number;
}

/** Read today's plan, generating and persisting it once on first access. */
export function getTodayPlan(userId: number, today = todayISO()): TodayPlan {
  const existing = db
    .select()
    .from(dailyPlans)
    .where(and(eq(dailyPlans.userId, userId), eq(dailyPlans.date, today)))
    .get();

  if (existing) {
    const items = (existing.itemsJson as PlanItem[]) ?? [];
    return {
      date: today,
      plan: {
        items,
        totalMinutes: items.reduce((s, i) => s + i.minutes, 0),
        targetMinutes: 150,
      },
      done: (existing.doneJson as string[]) ?? [],
      streak: getStreak(userId, today),
      weekNo: WEEK_NO,
    };
  }

  // yesterday's completion for the crash guard
  const prev = db
    .select()
    .from(dailyPlans)
    .where(eq(dailyPlans.userId, userId))
    .orderBy(desc(dailyPlans.date))
    .limit(1)
    .all()[0];

  const plan = generatePlan({
    weekNo: WEEK_NO,
    dueCount: getDueCount(userId, today),
    nextGrammarCode: nextGrammarCode(userId),
    yesterdayCompletion: prev ? completionOf(prev) : null,
  });

  db.insert(dailyPlans)
    .values({ userId, date: today, itemsJson: plan.items, doneJson: [], minutesActual: 0 })
    .onConflictDoNothing({ target: [dailyPlans.userId, dailyPlans.date] })
    .run();

  return { date: today, plan, done: [], streak: getStreak(userId, today), weekNo: WEEK_NO };
}

/** Mark one plan item done (idempotent). Returns the updated done list. */
export function completePlanItem(
  userId: number,
  key: string,
  today = todayISO(),
): string[] {
  const row = db
    .select()
    .from(dailyPlans)
    .where(and(eq(dailyPlans.userId, userId), eq(dailyPlans.date, today)))
    .get();
  if (!row) return [];

  const items = (row.itemsJson as PlanItem[]) ?? [];
  if (!items.some((i) => itemKey(i) === key)) return (row.doneJson as string[]) ?? [];

  const done = new Set((row.doneJson as string[]) ?? []);
  done.add(key);
  const doneArr = [...done];
  db.update(dailyPlans).set({ doneJson: doneArr }).where(eq(dailyPlans.id, row.id)).run();
  return doneArr;
}

/**
 * Consecutive fully-completed days ending today or yesterday. A day counts if
 * its plan had ≥1 item and all items are done. Today not-yet-done doesn't break
 * a streak built through yesterday.
 */
export function getStreak(userId: number, today = todayISO()): number {
  const rows = db
    .select({ date: dailyPlans.date, itemsJson: dailyPlans.itemsJson, doneJson: dailyPlans.doneJson })
    .from(dailyPlans)
    .where(eq(dailyPlans.userId, userId))
    .orderBy(desc(dailyPlans.date))
    .all();
  const doneByDate = new Map(
    rows.map((r) => {
      const c = completionOf(r);
      return [r.date, c !== null && c >= 1];
    }),
  );

  let streak = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  // if today isn't complete yet, start counting from yesterday
  if (!doneByDate.get(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  for (;;) {
    const d = cursor.toISOString().slice(0, 10);
    if (!doneByDate.get(d)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
