"use client";

import { useState } from "react";
import { ApiRequestError, submitExercise } from "@/lib/ui/api-client";
import type { ClozePayload, ExerciseView } from "./types";

const BLANK_RE = /_{3,}/g;

export default function QuestionCloze({
  exercise,
  onAnswered,
  onNext,
}: {
  exercise: ExerciseView;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
}) {
  const payload = exercise.payloadJson as ClozePayload;
  const segments = payload.text.split(BLANK_RE);
  const blankCount = payload.blanks.length;

  const [responses, setResponses] = useState<string[]>(
    Array(blankCount).fill(""),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [correct, setCorrect] = useState(false);
  const [blankResults, setBlankResults] = useState<boolean[]>([]);
  const [explain, setExplain] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const allFilled = responses.every((r) => r.trim().length > 0);

  function setBlank(i: number, value: string) {
    setResponses((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  async function submit() {
    if (status === "loading" || status === "done" || !allFilled) return;
    setStatus("loading");
    try {
      const res = await submitExercise(exercise.id, { responses });
      const isCorrect = res.result.correct;
      setCorrect(isCorrect);
      setBlankResults(
        res.result.type === "cloze" ? res.result.blanks : [],
      );
      setExplain(res.explain_zh);
      setStatus("done");
      onAnswered(isCorrect);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof ApiRequestError ? err.message : "提交失败，请重试。",
      );
    }
  }

  const locked = status === "loading" || status === "done";

  return (
    <div className="flex flex-col gap-5">
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-3 text-xl leading-loose text-stone-900">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span>{seg}</span>
            {i < blankCount && (
              <span className="inline-flex flex-col items-center">
                <input
                  type="text"
                  value={responses[i]}
                  disabled={locked}
                  onChange={(e) => setBlank(i, e.target.value)}
                  className={`h-11 w-28 rounded-xl border-2 px-2 text-center text-lg outline-none focus:border-emerald-500 ${
                    status === "done"
                      ? blankResults[i]
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-rose-400 bg-rose-50 text-rose-800"
                      : "border-stone-300 bg-white"
                  }`}
                />
              </span>
            )}
          </span>
        ))}
      </p>

      {status !== "done" && (
        <button
          type="button"
          onClick={submit}
          disabled={!allFilled || status === "loading"}
          className="min-h-[48px] w-fit rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {status === "loading" ? "提交中…" : "提交答案"}
        </button>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="text-base text-rose-600">
            {errorMsg}
          </p>
          <button
            type="button"
            onClick={submit}
            className="min-h-[44px] w-fit rounded-xl bg-stone-800 px-4 text-base font-medium text-white"
          >
            重试
          </button>
        </div>
      )}

      {status === "done" && (
        <div
          className={`flex flex-col gap-2 rounded-2xl px-5 py-4 ${
            correct ? "bg-emerald-50" : "bg-amber-50"
          }`}
        >
          <p
            className={`text-lg font-semibold ${
              correct ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {correct ? "回答正确！" : "答错了，没关系，看看解释："}
          </p>
          {explain && (
            <p className="text-base leading-relaxed text-stone-700">
              {explain}
            </p>
          )}
          <button
            type="button"
            onClick={onNext}
            className="mt-2 min-h-[48px] w-fit rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
          >
            下一题 →
          </button>
        </div>
      )}
    </div>
  );
}
