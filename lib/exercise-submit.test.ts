import { describe, expect, it } from "vitest";
import { SubmissionError, judgeSubmission } from "@/lib/exercise-submit";

const mcq = {
  type: "mcq",
  payloadJson: { question: "___ is my friend.", options: ["He", "Him", "His"] },
  answerJson: { index: 0 },
};
const cloze = {
  type: "cloze",
  payloadJson: { text: "This is ___ .", blanks: [{ accept: ["mine"] }] },
  answerJson: {},
};
const correctDel = {
  type: "correct",
  payloadJson: { tokens: ["I", "am", "agree", "with", "you"] },
  answerJson: { error_index: 1, delete: true },
};

describe("judgeSubmission", () => {
  it("mcq: correct index", () => {
    expect(judgeSubmission(mcq, { index: 0 })).toEqual({ type: "mcq", correct: true });
    expect(judgeSubmission(mcq, { index: 2 }).correct).toBe(false);
  });

  it("cloze: all blanks matched (normalized)", () => {
    const r = judgeSubmission(cloze, { responses: ["MINE"] });
    expect(r).toEqual({ type: "cloze", correct: true, blanks: [true] });
  });

  it("cloze: wrong blank reported", () => {
    expect(judgeSubmission(cloze, { responses: ["yours"] }).correct).toBe(false);
  });

  it("correct: deletion answer with empty fix scores full", () => {
    const r = judgeSubmission(correctDel, { index: 1, text: "" });
    expect(r).toMatchObject({ type: "correct", correct: true, score: 1 });
  });

  it("correct: wrong position scores 0", () => {
    expect(judgeSubmission(correctDel, { index: 0, text: "" }).correct).toBe(false);
  });

  it("throws SubmissionError on response shape mismatch", () => {
    expect(() => judgeSubmission(mcq, { responses: ["x"] })).toThrow(SubmissionError);
    expect(() => judgeSubmission(cloze, { index: 0 })).toThrow(SubmissionError);
    expect(() => judgeSubmission(correctDel, {})).toThrow(SubmissionError);
  });

  it("throws SubmissionError for an unsupported exercise type", () => {
    expect(() =>
      judgeSubmission({ type: "dictation", payloadJson: {}, answerJson: {} }, { index: 0 }),
    ).toThrow(SubmissionError);
  });
});
