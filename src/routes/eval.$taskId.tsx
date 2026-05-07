import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getEvalById, exportDataset, saveRoutingRule } from "@/lib/api/clawbench";
import { PageHeader } from "@/components/clawbench/page-header";
import { MetricCard, StatusBadge, WinnerBadge } from "@/components/clawbench/atoms";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Download, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/eval/$taskId")({ component: EvalDetail });

function EvalDetail() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["eval", taskId],
    queryFn: () => getEvalById(taskId),
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading eval…</div>;
  }
  if (!data?.task) {
    return <div className="p-6 text-sm text-muted-foreground">Eval not found.</div>;
  }
  const task = data.task as any;
  const runs = data.runs as any[];
  const winner = runs.find((r) => r.is_winner);
  const completed = runs.filter((r) => r.reliability_status === "completed");

  const copyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Output copied");
  };

  const exportWinner = async () => {
    if (!winner) return;
    const { body } = await exportDataset({ runIds: [winner.id], format: "jsonl", name: "Winner export" });
    const blob = new Blob([body], { type: "application/jsonl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clawbench-${task.id.slice(0, 8)}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported winning run");
  };

  const saveRule = async () => {
    if (!winner) return;
    await saveRoutingRule({
      task_type: task.task_type,
      primary_model: winner.model_id,
      fallback_model: runs.find((r) => !r.is_winner && r.reliability_status === "completed")?.model_id ?? null,
      strategy: task.strategy,
      confidence_threshold: 0.8,
      escalation_condition: `Auto-derived from eval ${task.id.slice(0, 8)}`,
      supporting_eval_count: 1,
    });
    toast.success("Routing rule saved");
  };

  return (
    <div>
      <PageHeader
        title="Eval Result"
        subtitle={`${task.task_type} • ${task.strategy} • ${new Date(task.created_at).toLocaleString()}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={exportWinner} className="gap-2">
              <Download className="h-4 w-4" /> Export winner
            </Button>
            <Button size="sm" onClick={saveRule} className="gap-2">
              <Save className="h-4 w-4" /> Save routing rule
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 p-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Prompt</div>
          <div className="mt-1 font-mono text-sm leading-relaxed">{task.prompt}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{task.task_type}</Badge>
            <Badge variant="outline">{task.strategy}</Badge>
            <Badge variant="outline">{(task.selected_models as string[]).length} models</Badge>
          </div>
        </section>

        {winner ? (
          <section className="rounded-lg border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-5">
            <div className="flex items-center gap-2">
              <WinnerBadge />
              <span className="text-xs text-muted-foreground">Recommended for {task.task_type}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-mono text-2xl font-semibold">{winner.model_display_name}</div>
                <div className="mt-1 max-w-2xl text-sm text-muted-foreground">{winner.recommendation_reason}</div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <Mini label="Quality" value={`${winner.quality_score?.toFixed(2)}/5`} />
                <Mini label="Efficiency" value={`${winner.efficiency_score?.toFixed(0)}/100`} />
                <Mini label="Latency" value={`${(winner.latency_ms / 1000).toFixed(1)}s`} />
                <Mini label="Cost" value={`$${winner.estimated_cost?.toFixed(4)}`} />
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-warning/40 bg-warning/5 p-5 text-sm">
            All runs failed or timed out. Re-run with different models.
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {runs.map((r) => (
            <div key={r.id} className={`rounded-lg border p-4 ${r.is_winner ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm font-semibold">{r.model_display_name}</div>
                <StatusBadge status={r.reliability_status} />
              </div>
              {r.reliability_status === "completed" ? (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Stat k="Quality" v={`${r.quality_score?.toFixed(2)}/5`} />
                    <Stat k="Efficiency" v={`${r.efficiency_score?.toFixed(0)}/100`} />
                    <Stat k="Latency" v={`${(r.latency_ms / 1000).toFixed(1)}s`} />
                    <Stat k="Cost" v={`$${r.estimated_cost?.toFixed(4)}`} />
                  </div>
                  <div className="mt-3">
                    <Badge variant="outline" className={r.json_valid ? "border-primary/40 text-primary" : "border-warning/40 text-warning"}>
                      JSON {r.json_valid ? "valid" : "invalid"}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <Sub k="Correctness" v={r.correctness} />
                    <Sub k="Completeness" v={r.completeness} />
                    <Sub k="Actionability" v={r.actionability} />
                    <Sub k="Format" v={r.format_reliability} />
                    <Sub k="Agent utility" v={r.agent_utility} />
                  </div>
                </>
              ) : (
                <div className="mt-3 text-xs text-muted-foreground">Run did not complete.</div>
              )}
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">
            Results table
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  {["", "Model", "Status", "Quality", "Efficiency", "Correct.", "Complete.", "Action.", "Format", "Latency", "In tok", "Out tok", "Cost", "Cost/Q", "JSON"].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {runs.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">{r.is_winner && <WinnerBadge />}</td>
                    <td className="px-3 py-2">{r.model_display_name}</td>
                    <td className="px-3 py-2"><StatusBadge status={r.reliability_status} /></td>
                    <td className="px-3 py-2">{r.quality_score?.toFixed(2) ?? "—"}</td>
                    <td className="px-3 py-2">{r.efficiency_score?.toFixed(0) ?? "—"}</td>
                    <td className="px-3 py-2">{r.correctness?.toFixed(2) ?? "—"}</td>
                    <td className="px-3 py-2">{r.completeness?.toFixed(2) ?? "—"}</td>
                    <td className="px-3 py-2">{r.actionability?.toFixed(2) ?? "—"}</td>
                    <td className="px-3 py-2">{r.format_reliability?.toFixed(2) ?? "—"}</td>
                    <td className="px-3 py-2">{r.latency_ms ? `${(r.latency_ms / 1000).toFixed(1)}s` : "—"}</td>
                    <td className="px-3 py-2">{r.input_tokens ?? "—"}</td>
                    <td className="px-3 py-2">{r.output_tokens ?? "—"}</td>
                    <td className="px-3 py-2">{r.estimated_cost ? `$${r.estimated_cost.toFixed(4)}` : "—"}</td>
                    <td className="px-3 py-2">{r.cost_per_quality_point ? `$${r.cost_per_quality_point.toFixed(5)}` : "—"}</td>
                    <td className="px-3 py-2">{r.json_valid === null ? "—" : r.json_valid ? "✓" : "✗"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">
              Outputs
            </div>
            <Tabs defaultValue={runs[0]?.id} className="p-4">
              <TabsList>
                {runs.map((r) => (
                  <TabsTrigger key={r.id} value={r.id} className="text-xs">
                    {r.model_display_name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {runs.map((r) => (
                <TabsContent key={r.id} value={r.id} className="mt-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => copyOutput(r.output ?? "")} className="gap-1.5">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                  <pre className="mt-2 max-h-96 overflow-auto rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground/90">
                    {r.output ?? "(no output)"}
                  </pre>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Score breakdown — winner</div>
            {winner ? (
              <>
                <div className="mt-3 h-48">
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { k: "Correct", v: winner.correctness },
                        { k: "Complete", v: winner.completeness },
                        { k: "Action", v: winner.actionability },
                        { k: "Format", v: winner.format_reliability },
                        { k: "Agent", v: winner.agent_utility },
                      ]}
                      margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                      <XAxis dataKey="k" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                      <Bar dataKey="v" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                  {winner.judge_explanation}
                </div>
              </>
            ) : (
              <div className="mt-3 text-xs text-muted-foreground">No winner.</div>
            )}
          </div>
        </section>

        {winner && (
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Routing recommendation</div>
            <div className="mt-2 grid gap-4 md:grid-cols-4">
              <Mini label="Task type" value={task.task_type} />
              <Mini label="Primary" value={winner.model_display_name} />
              <Mini label="Fallback" value={runs.find((r) => !r.is_winner && r.reliability_status === "completed")?.model_display_name ?? "—"} />
              <Mini label="Strategy" value={task.strategy} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{winner.recommendation_reason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={saveRule} className="gap-2"><Save className="h-4 w-4" /> Save Routing Rule</Button>
              <Button size="sm" variant="outline" onClick={exportWinner} className="gap-2"><Download className="h-4 w-4" /> Export Winning Run</Button>
              <Button size="sm" variant="ghost" asChild className="gap-2">
                <Link to="/"><RotateCcw className="h-4 w-4" /> Re-run Eval</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-background/60 px-2 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}

function Sub({ k, v }: { k: string; v: number | null }) {
  return (
    <div className="flex items-center justify-between">
      <span>{k}</span>
      <span className="font-mono">{v?.toFixed(2) ?? "—"}</span>
    </div>
  );
}
