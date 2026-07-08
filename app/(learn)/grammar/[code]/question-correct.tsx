"use client";

import { useState } from "react";
import { ApiRequestError, submitExercise } from "@/lib/ui/api-client";
import type { CorrectPayload, ExerciseView } from "./types";

export default function QuestionCorrect({
  exercise,
  onAnswered,
  onNext,
}: {
  exercise: ExerciseView;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
}) {
  const payload = exercise.payloadJson as CorrectPayload;
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [correct, setCorrect] = useState(false);
  const [positionCorrect, setPositionCorrect] = useState(false);
  const [correctionCorrect, setCorrectionCorrect] = useState(false);
  const [explain, setExplain] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const locked = status === "loading" || status === "done";

  async function submit() {
    if (selected === null || locked) return;
    setStatus("loading");
    try {
      const res = await submitExercise(exercise.id, {
        index: selected,
        text,
      });
      const isCorrect = res.result.correct;
      setCorrect(isCorrect);
      if (res.result.type === "correct") {
        setPositionCorrect(res.result.positionCorrect);
        setCorrectionCorrect(res.result.correctionCorrect);
      }
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
      <p className="text-base text-stone-500">
        点一下这句话里错的那个词，再在下面写出修正（如果这个词是多余的，就把输入框留空）。
      </p>

      <div className="flex flex-wrap gap-2">
        {payload.tokens.map((tok, i) => {
          const isSelected = selected === i;
          let cls =
            "border-stone-300 bg-white hover:border-emerald-400 hover:bg-emerald-50";
          if (locked && isSelected) {
            cls = positionCorrect
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-rose-400 bg-rose-50 text-rose-800";
          } else if (isSelected) {
            cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
          } else if (locked) {
            cls = "border-stone-200 bg-white opacity-50";
          }
          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => setSelected(i)}
              className={`min-h-[48px] rounded-xl border-2 px-4 text-lg text-stone-900 transition-colors ${cls}`}
            >
              {tok}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`fix-${exercise.id}`} className="text-base text-stone-700">
          修正为（词是多余的就留空）
        </label>
        <input
          id={`fix-${exercise.id}`}
          type="text"
          value={text}
          disabled={locked}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入正确的词，或留空表示删除"
          className={`h-12 w-full max-w-xs rounded-xl border-2 px-4 text-lg outline-none focus:border-emerald-500 ${
            locked
              ? correctionCorrect
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : "border-rose-400 bg-rose-50 text-rose-800"
              : "border-stone-300 bg-white"
          }`}
        />
      </div>

      {status !== "done" && (
        <button
          type="button"
          onClick={submit}
          disabled={selected === null || status === "loading"}
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
            {correct
              ? "全对！"
              : positionCorrect
                ? "找对了错词的位置，修正还差一点："
                : "错词位置不对，看看解释："}
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
