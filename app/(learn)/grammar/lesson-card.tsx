import Link from "next/link";
import type { LessonProgress } from "@/lib/progress";

/**
 * One lesson tile in the grammar directory. "available" lessons are the
 * whole-card <Link> to /grammar/{code}; "coming" lessons render as a
 * non-interactive, grayed-out placeholder (no href — nothing to click).
 */
export default function LessonCard({ lesson }: { lesson: LessonProgress }) {
  if (lesson.status === "coming") {
    return (
      <div
        aria-disabled="true"
        className="flex flex-col gap-2 rounded-2xl bg-stone-100 p-5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium uppercase tracking-wide text-stone-400">
            {lesson.code}
          </span>
          <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-500">
            即将推出
          </span>
        </div>
        <p className="text-lg font-semibold text-stone-500">{lesson.title}</p>
      </div>
    );
  }

  const pct = lesson.total > 0 ? Math.round((lesson.correct / lesson.total) * 100) : 0;

  return (
    <Link
      href={`/grammar/${lesson.code}`}
      className="flex min-h-[44px] flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium uppercase tracking-wide text-emerald-600">
          {lesson.code}
        </span>
        {lesson.state === "completed" && (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
            <span aria-hidden>✓</span> 已完成
          </span>
        )}
      </div>
      <p className="text-lg font-semibold text-stone-900">{lesson.title}</p>

      {lesson.state === "in_progress" && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-sm text-stone-500">
            学习中 · {lesson.correct}/{lesson.total}
          </span>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {lesson.state === "new" && (
        <span className="text-sm font-medium text-emerald-600">开始学习 →</span>
      )}
    </Link>
  );
}
