import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/grammar/L01");
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-amber-50 px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold text-stone-900">欢迎回来</h1>
          <p className="text-base text-stone-500">
            登录后继续学英语，一步一步来，不着急。
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
