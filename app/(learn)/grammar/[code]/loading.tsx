export default function LoadingLesson() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-stone-200" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-stone-200" />
      </div>
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm">
        <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
      </div>
      <p className="text-center text-base text-stone-400">课程加载中…</p>
    </div>
  );
}
