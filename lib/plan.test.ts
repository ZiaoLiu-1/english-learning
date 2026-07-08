import { describe, expect, it } from "vitest";
import { generatePlan, type PlanInput } from "@/lib/plan";

const base: PlanInput = {
  weekNo: 1,
  dueCount: 0,
  nextGrammarCode: "L01",
  yesterdayCompletion: null,
};

describe("generatePlan — task selection", () => {
  it("no due reviews, has a next lesson → grammar only", () => {
    const { items } = generatePlan(base);
    expect(items.map((i) => i.kind)).toEqual(["grammar"]);
    expect(items[0].refId).toBe("L01");
    expect(items[0].minutes).toBe(30);
  });

  it("due reviews + next lesson → review first, then grammar", () => {
    const { items } = generatePlan({ ...base, dueCount: 12 });
    expect(items.map((i) => i.kind)).toEqual(["review", "grammar"]);
    expect(items[0].minutes).toBe(15);
  });

  it("no next lesson (all learned) → review only", () => {
    const { items } = generatePlan({ ...base, dueCount: 8, nextGrammarCode: null });
    expect(items.map((i) => i.kind)).toEqual(["review"]);
  });

  it("nothing due and nothing new → empty plan", () => {
    const { items } = generatePlan({ ...base, dueCount: 0, nextGrammarCode: null });
    expect(items).toEqual([]);
  });
});

describe("generatePlan — review sizing (PLAN §5G)", () => {
  it("review is 15 min for a normal backlog", () => {
    expect(generatePlan({ ...base, dueCount: 40 }).items[0].minutes).toBe(15);
  });
  it("review jumps to 25 min when backlog > 40", () => {
    expect(generatePlan({ ...base, dueCount: 41 }).items[0].minutes).toBe(25);
  });
  it("review carries the due count in its title", () => {
    expect(generatePlan({ ...base, dueCount: 7 }).items[0].title).toContain("7");
  });
});

describe("generatePlan — yesterday downscale (防崩盘)", () => {
  it("yesterday < 60% scales every item's minutes by 0.8", () => {
    const { items } = generatePlan({ ...base, dueCount: 12, yesterdayCompletion: 0.5 });
    // review 15*0.8=12, grammar 30*0.8=24
    expect(items.map((i) => i.minutes)).toEqual([12, 24]);
  });
  it("yesterday >= 60% does not scale", () => {
    const { items } = generatePlan({ ...base, dueCount: 12, yesterdayCompletion: 0.6 });
    expect(items.map((i) => i.minutes)).toEqual([15, 30]);
  });
  it("no yesterday data does not scale", () => {
    const { items } = generatePlan({ ...base, dueCount: 12, yesterdayCompletion: null });
    expect(items.map((i) => i.minutes)).toEqual([15, 30]);
  });
});

describe("generatePlan — totals", () => {
  it("defaults target to 150 minutes", () => {
    expect(generatePlan(base).targetMinutes).toBe(150);
  });
  it("honors an explicit target", () => {
    expect(generatePlan({ ...base, targetMinutes: 90 }).targetMinutes).toBe(90);
  });
  it("totalMinutes is the sum of item minutes", () => {
    const plan = generatePlan({ ...base, dueCount: 12 });
    expect(plan.totalMinutes).toBe(45);
  });
});
