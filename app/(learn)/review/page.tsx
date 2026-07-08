import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import ReviewSession from "./review-session";

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
          今日复习
        </h1>
        <p className="text-base text-stone-500">
          把今天到期的题都做一遍，答对答错都会帮你自动安排下一次复习时间。
        </p>
      </header>

      <ReviewSession />
    </div>
  );
}
