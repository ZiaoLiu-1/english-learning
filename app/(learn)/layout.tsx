import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDueCount } from "@/lib/review";
import LogoutButton from "./logout-button";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard here (not just in the page below): this segment has no loading.tsx
  // of its own, so the redirect can still commit as a clean top-level 30x
  // before Next starts streaming a Suspense fallback for the child page.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const dueCount = getDueCount(user.uid);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-amber-50">
      <header className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/today" className="text-lg font-bold text-stone-900">
            英语学习
          </Link>
          <Link
            href="/today"
            className="text-base font-medium text-stone-500 hover:text-emerald-600"
          >
            今日
          </Link>
          <Link
            href="/grammar"
            className="text-base font-medium text-stone-500 hover:text-emerald-600"
          >
            语法目录
          </Link>
          <Link
            href="/review"
            className="flex items-center gap-1.5 text-base font-medium text-stone-500 hover:text-emerald-600"
          >
            复习
            {dueCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-semibold text-white">
                {dueCount}
              </span>
            )}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-base text-stone-500 sm:inline">
            你好，{user.name}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
