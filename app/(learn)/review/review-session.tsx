"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ExerciseRunner from "@/app/(learn)/grammar/[code]/exercise-runner";
import type { ExerciseView } from "@/app/(learn)/grammar/[code]/types";
import { ApiRequestError, getReviewQueue, type QueueExercise } from "@/lib/ui/api-client";

type Status = "loading" | "error" | "empty" | "ready" | "done";

export default function ReviewSession() {
  const [status, setStatus] = useState<Status>("loading");
  const [queue, setQueue] = useState<QueueExercise[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setStatus("loading");
    getReviewQueue()
      .then((res) => {
        setQueue(res.exercises);
        setStatus(res.exercises.length === 0 ? "empty" : "ready");
      })
      .catch((err) => {
        setErrorMsg(
          err instanceof ApiRequestError ? err.message : "加载失败，请重试。",
        );
        setStatus("error");
      });
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm">
        <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
        <p className="text-center text-base text-stone-400">正在准备今天的复习…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-sm">
        <p role="alert" className="text-lg text-rose-600">
          {errorMsg}
        </p>
        <button
          type="button"
          onClick={load}
          className="min-h-[48px] rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
        >
          重试
        </button>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-sm">
        <p className="text-xl font-semibold text-stone-800">
          今天没有要复习的题啦 🎉
        </p>
        <p className="text-base text-stone-500">
          去学新课，或者看看错题本，把没掌握的知识点再练一练。
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/grammar"
            className="min-h-[48px] inline-flex items-center rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
          >
            去学新课
          </Link>
          <Link
            href="/review/mistakes"
            className="min-h-[48px] inline-flex items-center rounded-2xl bg-stone-100 px-6 text-lg font-semibold text-stone-700 hover:bg-stone-200"
          >
            看看错题本
          </Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-sm">
        <p className="text-2xl font-bold text-stone-900">复习完成！</p>
        <p className="text-lg text-stone-600">
          答对 {correctCount} / {queue.length} 题，继续保持～
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/grammar"
            className="min-h-[48px] inline-flex items-center rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
          >
            返回目录
          </Link>
          <Link
            href="/review/mistakes"
            className="min-h-[48px] inline-flex items-center rounded-2xl bg-stone-100 px-6 text-lg font-semibold text-stone-700 hover:bg-stone-200"
          >
            看看错题本
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ExerciseRunner
      exercises={queue as ExerciseView[]}
      onAllDone={(count) => {
        setCorrectCount(count);
        setStatus("done");
      }}
    />
  );
}
