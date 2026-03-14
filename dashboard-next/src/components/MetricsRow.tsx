interface Metric {
  label: string;
  value: string | number;
}

export default function MetricsRow({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {m.label}
          </p>
          <p className="mt-1 text-2xl font-semibold">{m.value}</p>
        </div>
      ))}
    </div>
  );
}
