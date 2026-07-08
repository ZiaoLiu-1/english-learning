import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getTodayPlan, itemKey } from "@/lib/daily";
import TodayTasks from "./today-tasks";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { plan, done, streak } = getTodayPlan(user.uid);

  const tasks = plan.items.map((item) => ({
    ...item,
    key: itemKey(item),
    done: done.includes(itemKey(item)),
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
          你好，{user.name}
        </h1>
        <p className="text-base text-stone-500">
          {streak > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600">
              <span aria-hidden>🔥</span> 连续 {streak} 天
            </span>
          ) : (
            "今天开个头吧"
          )}
        </p>
        {plan.items.length > 0 && (
          <p className="text-base text-stone-500">
            今天约 {plan.totalMinutes} 分钟
          </p>
        )}
      </header>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-stone-800">
            今天的任务都清完啦 🎉
          </p>
          <p className="text-base text-stone-500">
            想再练练就去自由复习，或者翻翻语法目录。
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/review"
              className="inline-flex min-h-[48px] items-center rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
            >
              去复习
            </Link>
            <Link
              href="/grammar"
              className="inline-flex min-h-[48px] items-center rounded-2xl bg-stone-100 px-6 text-lg font-semibold text-stone-700 hover:bg-stone-200"
            >
              看语法目录
            </Link>
          </div>
        </div>
      ) : (
        <TodayTasks tasks={tasks} />
      )}
    </div>
  );
}
