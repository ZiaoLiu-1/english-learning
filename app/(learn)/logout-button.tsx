"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/ui/api-client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await logout();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="min-h-[44px] rounded-xl px-4 text-base font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-60"
    >
      {loading ? "退出中…" : "退出登录"}
    </button>
  );
}
