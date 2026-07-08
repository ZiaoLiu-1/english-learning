"use client";

import { useState } from "react";
import ProgressBar from "./progress-bar";
import QuestionCloze from "./question-cloze";
import QuestionCorrect from "./question-correct";
import QuestionMcq from "./question-mcq";
import type { ExerciseView } from "./types";

export default function ExerciseRunner({
  exercises,
  onAllDone,
}: {
  exercises: ExerciseView[];
  onAllDone: (correctCount: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answeredThisOne, setAnsweredThisOne] = useState(false);

  if (exercises.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center">
        <p className="text-lg text-stone-600">
          这节课的练习题还没准备好，先去看看讲解，或者稍后再回来。
        </p>
      </div>
    );
  }

  const current = exercises[index];

  function handleAnswered(correct: boolean) {
    setAnsweredThisOne(true);
    if (correct) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }

  function handleNext() {
    setAnsweredThisOne(false);
    if (index + 1 >= exercises.length) {
      onAllDone(correctCount);
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ProgressBar done={index} total={exercises.length} label="练习进度" />

      {streak >= 3 && !answeredThisOne && (
        <p className="text-base font-medium text-emerald-600">
          连对 {streak} 题，继续保持！
        </p>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        {current.type === "mcq" && (
          <QuestionMcq
            key={current.id}
            exercise={current}
            onAnswered={handleAnswered}
            onNext={handleNext}
          />
        )}
        {current.type === "cloze" && (
          <QuestionCloze
            key={current.id}
            exercise={current}
            onAnswered={handleAnswered}
            onNext={handleNext}
          />
        )}
        {current.type === "correct" && (
          <QuestionCorrect
            key={current.id}
            exercise={current}
            onAnswered={handleAnswered}
            onNext={handleNext}
          />
        )}
        {current.type !== "mcq" &&
          current.type !== "cloze" &&
          current.type !== "correct" && (
            <div className="flex flex-col gap-3">
              <p className="text-base text-stone-500">
                这道题的类型暂不支持展示，先跳过它。
              </p>
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[48px] w-fit rounded-2xl bg-stone-700 px-6 text-lg font-semibold text-white hover:bg-stone-800"
              >
                跳过 →
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
