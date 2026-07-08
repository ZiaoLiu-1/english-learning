"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiRequestError, completePlanItem } from "@/lib/ui/api-client";
import type { TaskKind } from "@/lib/plan";

export interface TodayTask {
  kind: TaskKind;
  refId?: string;
  minutes: number;
  title: string;
  key: string;
  done: boolean;
}

const KIND_STYLE: Record<TaskKind, { emoji: string; dot: string; label: string }> = {
  review: { emoji: "🔁", dot: "bg-amber-400", label: "复习" },
  grammar: { emoji: "📘", dot: "bg-emerald-500", label: "学新课" },
  phonics: { emoji: "🔊", dot: "bg-emerald-500", label: "发音" },
  dictation: { emoji: "✍️", dot: "bg-amber-400", label: "听写" },
  sentence: { emoji: "💬", dot: "bg-emerald-500", label: "造句" },
};

function hrefFor(task: TodayTask): string {
  if (task.kind === "review") return "/review";
  if (task.kind === "grammar" && task.refId) return `/grammar/${task.refId}`;
  return "/grammar";
}

export default function TodayTasks({ tasks: initialTasks }: { tasks: TodayTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allDone = tasks.length > 0 && tasks.every((t) => t.done);

  async function markDone(key: string) {
    if (pendingKey) return;
    setPendingKey(key);
    setErrorMsg(null);
    try {
      const { done } = await completePlanItem(key);
      setTasks((prev) => prev.map((t) => ({ ...t, done: done.includes(t.key) })));
    } catch (err) {
      setErrorMsg(err instanceof ApiRequestError ? err.message : "完成失败，请重试。");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {tasks.map((task) => {
          const style = KIND_STYLE[task.kind];
          return (
            <li
              key={task.key}
              className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-opacity ${
                task.done ? "opacity-60" : ""
              }`}
            >
              <span
                aria-hidden
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${style.dot}`}
              >
                {style.emoji}
              </span>
              <Link href={hrefFor(task)} className="flex min-h-[44px] flex-1 flex-col justify-center gap-0.5">
                <span
                  className={`text-lg font-semibold ${
                    task.done ? "text-stone-500 line-through decoration-stone-300" : "text-stone-900"
                  }`}
                >
                  {task.title}
                </span>
                <span className="text-sm text-stone-500">
                  {task.done ? "✓ 已完成 · 还可以再看看" : `约 ${task.minutes} 分钟`}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => markDone(task.key)}
                disabled={task.done || pendingKey === task.key}
                aria-label={task.done ? "已完成" : `完成 ${task.title}`}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-xl font-bold transition-colors ${
                  task.done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-stone-300 text-stone-400 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-60"
                }`}
              >
                {pendingKey === task.key ? "…" : "✓"}
              </button>
            </li>
          );
        })}
      </ul>

      {errorMsg && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-base text-rose-700">
          {errorMsg}
        </p>
      )}

      {allDone && (
        <p className="text-center text-base font-medium text-emerald-600">
          今天都做完啦，明天见！
        </p>
      )}
    </div>
  );
}
