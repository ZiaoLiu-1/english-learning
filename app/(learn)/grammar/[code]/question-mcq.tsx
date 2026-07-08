"use client";

import { useState } from "react";
import { ApiRequestError, submitExercise } from "@/lib/ui/api-client";
import type { ExerciseView, McqPayload } from "./types";

export default function QuestionMcq({
  exercise,
  onAnswered,
  onNext,
}: {
  exercise: ExerciseView;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
}) {
  const payload = exercise.payloadJson as McqPayload;
  const [chosen, setChosen] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [correct, setCorrect] = useState(false);
  const [explain, setExplain] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function choose(index: number) {
    if (status === "loading" || status === "done") return;
    setChosen(index);
    setStatus("loading");
    try {
      const res = await submitExercise(exercise.id, { index });
      const isCorrect = res.result.correct;
      setCorrect(isCorrect);
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

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xl font-medium leading-relaxed text-stone-900">
        {payload.question}
      </p>

      <div className="flex flex-col gap-3">
        {payload.options.map((opt, i) => {
          const isChosen = chosen === i;
          let stateClasses =
            "border-stone-300 bg-white hover:border-emerald-400 hover:bg-emerald-50";
          if (status === "done" && isChosen) {
            stateClasses = correct
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-rose-400 bg-rose-50 text-rose-800";
          } else if (status !== "idle" && status !== "error" && !isChosen) {
            stateClasses = "border-stone-200 bg-white opacity-50";
          }
          return (
            <button
              key={i}
              type="button"
              disabled={status === "loading" || status === "done"}
              onClick={() => choose(i)}
              className={`min-h-[52px] rounded-2xl border-2 px-5 py-3 text-left text-lg text-stone-900 transition-colors ${stateClasses}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {status === "error" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="text-base text-rose-600">
            {errorMsg}
          </p>
          <button
            type="button"
            onClick={() => chosen !== null && choose(chosen)}
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
