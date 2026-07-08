"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, login } from "@/lib/ui/api-client";

export default function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !password) {
      setStatus("error");
      setErrorMsg("请输入用户名和密码。");
      return;
    }
    setStatus("loading");
    try {
      await login(name.trim(), password);
      router.push("/grammar/L01");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof ApiRequestError ? err.message : "登录失败，请再试一次。",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-base font-medium text-stone-700">
          用户名
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-[52px] rounded-2xl border border-stone-300 bg-white px-4 text-lg text-stone-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          placeholder="learner"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-base font-medium text-stone-700"
        >
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-[52px] rounded-2xl border border-stone-300 bg-white px-4 text-lg text-stone-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          placeholder="请输入密码"
        />
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-base text-rose-700"
        >
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 min-h-[52px] rounded-2xl bg-emerald-600 text-lg font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {status === "loading" ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
