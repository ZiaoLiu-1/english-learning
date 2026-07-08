export default function ProgressBar({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>{label}</span>
        <span>
          {done} / {total}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
