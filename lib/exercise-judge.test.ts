import { describe, expect, it } from "vitest";
import { judgeCloze, judgeCorrect, judgeMcq } from "@/lib/exercise-judge";

describe("judgeMcq", () => {
  it("correct when chosen index equals answer", () => {
    expect(judgeMcq({ index: 2 }, 2)).toEqual({ correct: true });
  });
  it("wrong otherwise, including out-of-range", () => {
    expect(judgeMcq({ index: 2 }, 0).correct).toBe(false);
    expect(judgeMcq({ index: 2 }, 99).correct).toBe(false);
  });
});

describe("judgeCloze", () => {
  const blanks = [{ accept: ["goes"] }, { accept: ["does not", "doesn't"] }];

  it("all blanks matching → correct with per-blank detail", () => {
    const r = judgeCloze(blanks, ["goes", "does not"]);
    expect(r.correct).toBe(true);
    expect(r.blanks).toEqual([true, true]);
  });

  it("is case/whitespace-insensitive", () => {
    expect(judgeCloze(blanks, ["  Goes ", "DOESN'T"]).correct).toBe(true);
  });

  it("unifies unicode apostrophes", () => {
    expect(judgeCloze(blanks, ["goes", "doesn’t"]).correct).toBe(true);
  });

  it("falls back to contraction-expanded comparison", () => {
    // accept lists only the long form; learner types the contraction (covered
    // above) and vice versa: accept lists only the contraction
    const r = judgeCloze([{ accept: ["don't"] }], ["do not"]);
    expect(r.correct).toBe(true);
  });

  it("wrong blank reported individually", () => {
    const r = judgeCloze(blanks, ["go", "doesn't"]);
    expect(r.correct).toBe(false);
    expect(r.blanks).toEqual([false, true]);
  });

  it("missing responses count as wrong", () => {
    const r = judgeCloze(blanks, ["goes"]);
    expect(r.correct).toBe(false);
    expect(r.blanks).toEqual([true, false]);
  });
});

describe("judgeCorrect (two-part: find the error + fix it)", () => {
  const answer = { error_index: 1, corrections: ["likes"] };

  it("both parts right → score 1", () => {
    expect(judgeCorrect(answer, { index: 1, text: "likes" })).toEqual({
      correct: true,
      positionCorrect: true,
      correctionCorrect: true,
      score: 1,
    });
  });

  it("right position, wrong fix → score 0.5, not correct", () => {
    const r = judgeCorrect(answer, { index: 1, text: "liked" });
    expect(r.score).toBe(0.5);
    expect(r.correct).toBe(false);
    expect(r.positionCorrect).toBe(true);
  });

  it("wrong position → score 0 even if text matches a correction", () => {
    const r = judgeCorrect(answer, { index: 0, text: "likes" });
    expect(r.score).toBe(0);
    expect(r.correctionCorrect).toBe(false);
  });

  it("correction matching is normalized (case, apostrophes, contractions)", () => {
    const r = judgeCorrect(
      { error_index: 0, corrections: ["doesn't"] },
      { index: 0, text: "Does Not" },
    );
    expect(r.correct).toBe(true);
  });
});
