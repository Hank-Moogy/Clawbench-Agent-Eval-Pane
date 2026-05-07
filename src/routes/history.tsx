import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEvalHistory } from "@/lib/api/clawbench";
import { PageHeader } from "@/components/clawbench/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge, WinnerBadge } from "@/components/clawbench/atoms";
import { MODELS, STRATEGIES, TASK_TYPES } from "@/lib/clawbench/constants";
import { Eye, History as HistoryIcon } from "lucide-react";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const [taskType, setTaskType] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const [strategy, setStrategy] = useState<string>("");
  const [minScore, setMinScore] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["history", taskType, winner, strategy, minScore],
    queryFn: () =>
      getEvalHistory({
        task_type: taskType || undefined,
        winning_model: winner || undefined,
        strategy: strategy || undefined,
        min_score: minScore ? +minScore : undefined,
      }),
  });

  return (
    <div>
      <PageHeader title="Eval History" subtitle="Every benchmark run, persisted and queryable." />
      <div className="space-y-4 p-6">
        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-5">
          <Filter label="Task type" value={taskType} onChange={setTaskType} options={TASK_TYPES.map((t) => ({ v: t.id, l: t.label }))} />
          <Filter label="Winning model" value={winner} onChange={setWinner} options={MODELS.map((m) => ({ v: m.id, l: m.name }))} />
          <Filter label="Strategy" value={strategy} onChange={setStrategy} options={STRATEGIES.map((s) => ({ v: s.id, l: s.label }))} />
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Min quality</label>
            <Input
              type="number"
              step="0.1"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="e.g. 4.0"
              className="mt-1.5"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setTaskType("");
                setWinner("");
                setStrategy("");
                setMinScore("");
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <HistoryIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 font-medium">No evals match these filters</div>
            <p className="mt-1 text-sm text-muted-foreground">Run your first agent eval to compare models.</p>
            <Button asChild className="mt-4"><Link to="/">Run Eval</Link></Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  {["Date", "Prompt", "Task", "Models", "Winner", "Score", "Avg latency", "Total cost", "Strategy", "Status", ""].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {data!.map(({ task, winner, avgLatency, totalCost }) => (
                  <tr key={task.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(task.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 max-w-xs truncate" title={task.prompt}>{task.prompt}</td>
                    <td className="px-3 py-2">{task.task_type}</td>
                    <td className="px-3 py-2">{(task.selected_models as string[]).length}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {winner && <WinnerBadge />}
                        <span>{winner?.model_display_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{winner?.quality_score?.toFixed(2) ?? "—"}</td>
                    <td className="px-3 py-2">{avgLatency ? `${(avgLatency / 1000).toFixed(1)}s` : "—"}</td>
                    <td className="px-3 py-2">${totalCost.toFixed(4)}</td>
                    <td className="px-3 py-2">{task.strategy}</td>
                    <td className="px-3 py-2"><StatusBadge status={winner?.reliability_status ?? "completed"} /></td>
                    <td className="px-3 py-2">
                      <Button asChild size="sm" variant="ghost" className="gap-1.5">
                        <Link to="/eval/$taskId" params={{ taskId: task.id }}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
        <SelectTrigger className="mt-1.5"><SelectValue placeholder="All" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
