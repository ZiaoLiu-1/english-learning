import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getErrorBook } from "@/lib/review";

const TYPE_LABEL_ZH: Record<string, string> = {
  mcq: "选择",
  cloze: "填空",
  correct: "改错",
};

function typeLabel(type: string): string {
  return TYPE_LABEL_ZH[type] ?? type;
}

export default async function MistakesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const groups = getErrorBook(user.uid);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/review"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-stone-500 hover:text-emerald-600"
        >
          <span aria-hidden>←</span> 返回今日复习
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
          错题本
        </h1>
        <p className="text-base text-stone-500">
          按语法点整理了你做错过的题，挑一个回去重新学一学。
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-stone-800">
            还没有错题，继续保持！
          </p>
          <p className="text-base text-stone-500">
            所有做过的题都答对了，真棒。
          </p>
          <Link
            href="/grammar"
            className="mt-2 inline-flex min-h-[48px] items-center rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
          >
            返回目录
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div
              key={group.code}
              className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-lg font-bold text-stone-800">
                  <span className="text-sm font-medium uppercase tracking-wide text-emerald-600">
                    {group.code}
                  </span>{" "}
                  · {group.title}
                </h2>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-sm font-medium text-rose-600">
                  错 {group.wrongCount} 题
                </span>
              </div>

              <ul className="flex flex-col gap-2">
                {group.exercises.map((ex) => (
                  <li
                    key={ex.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-2.5"
                  >
                    <span className="truncate text-base text-stone-700">
                      {ex.uid}
                    </span>
                    <span className="shrink-0 rounded-full bg-stone-200 px-2.5 py-0.5 text-sm font-medium text-stone-600">
                      {typeLabel(ex.type)}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/grammar/${group.code}`}
                className="inline-flex min-h-[48px] w-fit items-center rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
              >
                重新学这节课 →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
