"use client";

export default function LessonError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-xl font-semibold text-stone-800">课程加载出了点问题</p>
      <p className="text-base text-stone-500">
        不是你的问题，刷新一下应该就好了。
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 min-h-[48px] rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
      >
        重试
      </button>
    </div>
  );
}
