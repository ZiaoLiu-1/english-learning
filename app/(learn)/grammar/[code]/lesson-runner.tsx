"use client";

import { useState } from "react";
import ExerciseRunner from "./exercise-runner";
import SentencePack from "./sentence-pack";
import type { ExerciseView, SentenceView } from "./types";

type Stage = "exercises" | "sentences" | "done";

export default function LessonRunner({
  lessonTitle,
  exercises,
  sentences,
}: {
  lessonTitle: string;
  exercises: ExerciseView[];
  sentences: SentenceView[];
}) {
  const [stage, setStage] = useState<Stage>("exercises");
  const [exerciseCorrectCount, setExerciseCorrectCount] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  function restart() {
    setExerciseCorrectCount(0);
    setStage("exercises");
    setResetKey((k) => k + 1);
  }

  return (
    <div id="exercises" className="flex flex-col gap-6">
      {stage === "exercises" && (
        <ExerciseRunner
          key={`ex-${resetKey}`}
          exercises={exercises}
          onAllDone={(correctCount) => {
            setExerciseCorrectCount(correctCount);
            setStage("sentences");
          }}
        />
      )}

      {stage === "sentences" && (
        <SentencePack
          key={`sp-${resetKey}`}
          sentences={sentences}
          onAllDone={() => setStage("done")}
        />
      )}

      {stage === "done" && (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-2xl font-bold text-stone-900">
            太棒了，{lessonTitle} 学完了！
          </p>
          <p className="text-lg text-stone-600">
            练习题答对 {exerciseCorrectCount} / {exercises.length} 道，句构关卡
            {sentences.length} 句全部完成。
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-2 min-h-[48px] rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
          >
            重新做一遍
          </button>
        </div>
      )}
    </div>
  );
}
