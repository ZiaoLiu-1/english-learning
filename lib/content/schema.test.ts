import { describe, expect, it } from "vitest";
import { correctExercise } from "@/lib/content/schema";

const base = {
  uid: "L03-correct-01",
  type: "correct",
  difficulty: 2,
  explain_zh: "be 后面不能再接实义动词原形，删掉多余的 be。",
  payload: { tokens: ["I", "am", "agree", "with", "you"] },
};

describe("correctExercise answer: corrections XOR delete", () => {
  it("accepts a replacement answer", () => {
    const r = correctExercise.safeParse({
      ...base,
      answer: { error_index: 1, corrections: ["really"] },
    });
    expect(r.success).toBe(true);
  });

  it("accepts a deletion answer", () => {
    const r = correctExercise.safeParse({
      ...base,
      answer: { error_index: 1, delete: true },
    });
    expect(r.success).toBe(true);
  });

  it("rejects both corrections and delete together", () => {
    const r = correctExercise.safeParse({
      ...base,
      answer: { error_index: 1, corrections: ["x"], delete: true },
    });
    expect(r.success).toBe(false);
  });

  it("rejects neither corrections nor delete", () => {
    const r = correctExercise.safeParse({ ...base, answer: { error_index: 1 } });
    expect(r.success).toBe(false);
  });
});
