import type { AgentRun } from "@/lib/api";

export default function RunHistory({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return <p className="mt-2 text-xs text-zinc-400">尚無執行紀錄</p>;
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700">
            <th className="pb-2 pr-3 font-medium">時間</th>
            <th className="pb-2 pr-3 font-medium">結果</th>
            <th className="pb-2 pr-3 font-medium">花費</th>
            <th className="pb-2 pr-3 font-medium">Tokens</th>
            <th className="pb-2 pr-3 font-medium">Commit</th>
            <th className="pb-2 pr-3 font-medium">Files</th>
            <th className="pb-2 pr-3 font-medium">QA</th>
            <th className="pb-2 font-medium">Branch</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run, i) => (
            <tr
              key={i}
              className="border-b border-zinc-100 dark:border-zinc-800"
            >
              <td className="py-1.5 pr-3 whitespace-nowrap">
                {run.started_at || "—"}
              </td>
              <td className="py-1.5 pr-3">
                {run.exit_code === 0 ? "✅" : `❌ (${run.exit_code})`}
              </td>
              <td className="py-1.5 pr-3">
                {run.cost_usd != null ? `$${run.cost_usd.toFixed(4)}` : "—"}
              </td>
              <td className="py-1.5 pr-3">
                {run.tokens_used?.toLocaleString() || "—"}
              </td>
              <td className="py-1.5 pr-3 font-mono">
                {run.commit_sha || "—"}
              </td>
              <td className="py-1.5 pr-3">
                {run.files_changed != null ? run.files_changed : "—"}
              </td>
              <td className="py-1.5 pr-3">
                {run.qa_passed === 1
                  ? "✅"
                  : run.qa_passed === 0
                    ? "❌"
                    : "—"}
              </td>
              <td className="py-1.5">{run.branch_name || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
