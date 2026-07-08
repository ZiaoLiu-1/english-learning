import { describe, expect, it } from "vitest";
import { addDays, INITIAL, mapQuality, review, type SrsState } from "@/lib/srs";

const TODAY = "2026-07-07";

describe("mapQuality", () => {
  it("wrong answer → 1", () => {
    expect(mapQuality({ correct: false })).toBe(1);
    expect(mapQuality({ correct: false, usedHint: true, secondTry: true })).toBe(1);
  });
  it("correct on second try → 3", () => {
    expect(mapQuality({ correct: true, secondTry: true })).toBe(3);
  });
  it("correct first try with hint → 4", () => {
    expect(mapQuality({ correct: true, usedHint: true })).toBe(4);
  });
  it("correct first try, no hint → 5", () => {
    expect(mapQuality({ correct: true })).toBe(5);
  });
});

describe("addDays", () => {
  it("adds within a month", () => {
    expect(addDays("2026-07-07", 6)).toBe("2026-07-13");
  });
  it("crosses a month boundary", () => {
    expect(addDays("2026-07-30", 3)).toBe("2026-08-02");
  });
  it("handles leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("adds zero days", () => {
    expect(addDays("2026-07-07", 0)).toBe("2026-07-07");
  });
  it("crosses a year boundary", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("review — interval progression on success", () => {
  it("first success: reps 0 → interval 1, reps 1", () => {
    const r = review(INITIAL, 5, TODAY);
    expect(r.reps).toBe(1);
    expect(r.intervalD).toBe(1);
    expect(r.due).toBe("2026-07-08");
    expect(r.lapses).toBe(0);
  });
  it("second success: reps 1 → interval 6", () => {
    const r = review({ ef: 2.6, intervalD: 1, reps: 1, lapses: 0 }, 5, TODAY);
    expect(r.reps).toBe(2);
    expect(r.intervalD).toBe(6);
    expect(r.due).toBe("2026-07-13");
  });
  it("third success: interval = round(prev.interval * prev.ef)", () => {
    const r = review({ ef: 2.5, intervalD: 6, reps: 2, lapses: 0 }, 4, TODAY);
    expect(r.intervalD).toBe(15); // round(6 * 2.5)
    expect(r.reps).toBe(3);
    expect(r.due).toBe(addDays(TODAY, 15));
  });
});

describe("review — EF adjustment (PLAN §6.5)", () => {
  it("q=5 raises EF by 0.1", () => {
    expect(review({ ef: 2.5, intervalD: 1, reps: 1, lapses: 0 }, 5, TODAY).ef).toBeCloseTo(2.6, 10);
  });
  it("q=4 leaves EF unchanged", () => {
    expect(review({ ef: 2.5, intervalD: 1, reps: 1, lapses: 0 }, 4, TODAY).ef).toBeCloseTo(2.5, 10);
  });
  it("q=3 lowers EF by 0.14", () => {
    expect(review({ ef: 2.5, intervalD: 1, reps: 1, lapses: 0 }, 3, TODAY).ef).toBeCloseTo(2.36, 10);
  });
  it("EF never drops below the 1.3 floor", () => {
    let state: SrsState = { ef: 1.3, intervalD: 10, reps: 3, lapses: 0 };
    for (let i = 0; i < 5; i++) state = review(state, 1, TODAY);
    expect(state.ef).toBe(1.3);
  });
});

describe("review — lapse (q < 3)", () => {
  it("resets reps to 0, interval to 1, increments lapses", () => {
    const r = review({ ef: 2.5, intervalD: 30, reps: 4, lapses: 1 }, 1, TODAY);
    expect(r.reps).toBe(0);
    expect(r.intervalD).toBe(1);
    expect(r.lapses).toBe(2);
    expect(r.due).toBe("2026-07-08");
  });
  it("lapse still applies the EF penalty (drops ~0.54)", () => {
    expect(review({ ef: 2.5, intervalD: 30, reps: 4, lapses: 0 }, 1, TODAY).ef).toBeCloseTo(1.96, 10);
  });
  it("a fresh card answered wrong immediately", () => {
    const r = review(INITIAL, 1, TODAY);
    expect(r.reps).toBe(0);
    expect(r.intervalD).toBe(1);
    expect(r.lapses).toBe(1);
  });
});
