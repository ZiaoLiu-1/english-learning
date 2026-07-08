import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
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

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-amber-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sm:px-8">
        <span className="text-lg font-bold text-stone-900">英语学习</span>
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
