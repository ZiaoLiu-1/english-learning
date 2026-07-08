import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurriculumProgress } from "@/lib/progress";
import LessonCard from "./lesson-card";

export default async function GrammarDirectoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { stages, totals } = getCurriculumProgress(user.uid);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
          语法课程
        </h1>
        <p className="text-base text-stone-500">
          已就绪 {totals.available} / {totals.lessons} 课 · 已完成{" "}
          {totals.completed} 课
        </p>
      </header>

      {stages.map((stage) => (
        <section key={stage.stage} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-lg font-bold text-stone-800">
              阶段 {stage.stage} · {stage.name}
              <span className="ml-2 text-sm font-normal text-stone-400">
                {stage.weeks}
              </span>
            </h2>
            <span className="text-sm text-stone-500">
              {stage.availableCount}/{stage.lessons.length} 就绪
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stage.lessons.map((lesson) => (
              <LessonCard key={lesson.code} lesson={lesson} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
