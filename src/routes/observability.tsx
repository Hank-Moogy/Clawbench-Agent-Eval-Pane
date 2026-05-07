import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAllRuns } from "@/lib/api/clawbench";
import { PageHeader } from "@/components/clawbench/page-header";
import { MetricCard } from "@/components/clawbench/atoms";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { MODELS, MODEL_COLORS, TASK_TYPES } from "@/lib/clawbench/constants";

export const Route = createFileRoute("/observability")({ component: ObservabilityPage });

function ObservabilityPage() {
  const { data: runs = [] } = useQuery({ queryKey: ["all-runs"], queryFn: getAllRuns });

  const totalRuns = runs.length;
  const totalTasks = new Set(runs.map((r: any) => r.task_id)).size;
  const completed = runs.filter((r: any) => r.reliability_status === "completed");
  const avgQ = completed.length ? completed.reduce((s: number, r: any) => s + (r.quality_score ?? 0), 0) / completed.length : 0;
  const avgLat = completed.length ? completed.reduce((s: number, r: any) => s + (r.latency_ms ?? 0), 0) / completed.length : 0;
  const totalCost = runs.reduce((s: number, r: any) => s + (r.estimated_cost ?? 0), 0);
  const avgCost = totalRuns ? totalCost / totalRuns : 0;
  const avgEff = completed.length ? completed.reduce((s: number, r: any) => s + (r.efficiency_score ?? 0), 0) / completed.length : 0;
  const jsonRate = runs.length ? runs.filter((r: any) => r.json_valid).length / runs.length : 0;
  const failureRate = runs.length ? runs.filter((r: any) => r.reliability_status !== "completed").length / runs.length : 0;

  // most frequent winner
  const winCounts: Record<string, number> = {};
  runs.filter((r: any) => r.is_winner).forEach((r: any) => {
    winCounts[r.model_id] = (winCounts[r.model_id] ?? 0) + 1;
  });
  const topWinner = Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0];

  // runs over time (by day)
  const byDay: Record<string, number> = {};
  runs.forEach((r: any) => {
    const d = new Date(r.created_at).toISOString().slice(5, 10);
    byDay[d] = (byDay[d] ?? 0) + 1;
  });
  const overTime = Object.entries(byDay).map(([d, v]) => ({ d, v }));

  const taskDist = TASK_TYPES.map((t) => ({
    name: t.label,
    value: runs.filter((r: any) => r.eval_tasks?.task_type === t.id).length,
  }));

  const byModel = MODELS.map((m) => {
    const list = runs.filter((r: any) => r.model_id === m.id);
    const c = list.filter((r: any) => r.reliability_status === "completed");
    return {
      id: m.id,
      name: m.name,
      winRate: list.length ? list.filter((r: any) => r.is_winner).length / list.length : 0,
      latency: c.length ? c.reduce((s: number, r: any) => s + (r.latency_ms ?? 0), 0) / c.length / 1000 : 0,
      cost: c.length ? c.reduce((s: number, r: any) => s + (r.estimated_cost ?? 0), 0) / c.length : 0,
      failRate: list.length ? list.filter((r: any) => r.reliability_status !== "completed").length / list.length : 0,
      jsonRate: list.length ? list.filter((r: any) => r.json_valid).length / list.length : 0,
    };
  });

  const scatter = completed.map((r: any) => ({ x: r.estimated_cost, y: r.quality_score, model: r.model_id }));

  const insights = generateInsights(byModel, jsonRate);

  return (
    <div>
      <PageHeader title="Observability" subtitle="Operational metrics for eval and routing performance." />
      <div className="space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-5">
          <MetricCard label="Total runs" value={totalRuns} />
          <MetricCard label="Total tasks" value={totalTasks} />
          <MetricCard label="Avg quality" value={avgQ.toFixed(2)} hint="/ 5" accent="primary" />
          <MetricCard label="Avg latency" value={`${(avgLat / 1000).toFixed(1)}s`} />
          <MetricCard label="Total cost" value={`$${totalCost.toFixed(4)}`} />
          <MetricCard label="Avg cost / run" value={`$${avgCost.toFixed(4)}`} />
          <MetricCard label="Top winner" value={MODELS.find((m) => m.id === topWinner?.[0])?.name ?? "—"} hint={`${topWinner?.[1] ?? 0} wins`} accent="primary" />
          <MetricCard label="JSON validity" value={`${(jsonRate * 100).toFixed(0)}%`} />
          <MetricCard label="Failure rate" value={`${(failureRate * 100).toFixed(0)}%`} accent={failureRate > 0.1 ? "warning" : "default"} />
          <MetricCard label="Avg efficiency" value={`${avgEff.toFixed(0)}/100`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Eval runs over time">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={overTime} margin={{ left: -20 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="v" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Win rate by model">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byModel.map((m) => ({ name: m.name, v: +(m.winRate * 100).toFixed(1) }))} margin={{ left: -20 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>{byModel.map((m) => <Cell key={m.id} fill={MODEL_COLORS[m.id]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Avg latency by model (s)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byModel.map((m) => ({ name: m.name, v: +m.latency.toFixed(1) }))} margin={{ left: -20 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>{byModel.map((m) => <Cell key={m.id} fill={MODEL_COLORS[m.id]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Avg cost by model">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byModel.map((m) => ({ name: m.name, v: +m.cost.toFixed(4) }))} margin={{ left: -20 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>{byModel.map((m) => <Cell key={m.id} fill={MODEL_COLORS[m.id]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Quality vs cost (per run)">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" tickFormatter={(v) => `$${v.toFixed(3)}`} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis type="number" dataKey="y" domain={[3, 5]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <ZAxis range={[40, 80]} />
                <Tooltip contentStyle={tooltipStyle} />
                {MODELS.map((m) => (
                  <Scatter key={m.id} name={m.name} data={scatter.filter((d: any) => d.model === m.id)} fill={MODEL_COLORS[m.id]} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Task type distribution">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {taskDist.map((_, i) => <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Failure / timeout rate by model">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byModel.map((m) => ({ name: m.name, v: +(m.failRate * 100).toFixed(1) }))} margin={{ left: -20 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]} fill="var(--destructive)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="JSON validity rate by model">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byModel.map((m) => ({ name: m.name, v: +(m.jsonRate * 100).toFixed(1) }))} margin={{ left: -20 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>{byModel.map((m) => <Cell key={m.id} fill={MODEL_COLORS[m.id]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Insights</div>
          <ul className="mt-3 space-y-2 text-sm">
            {insights.map((i, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function generateInsights(byModel: any[], jsonRate: number) {
  if (byModel.every((m) => !m.winRate)) return ["Run a few evals to populate insights."];
  const top = [...byModel].sort((a, b) => b.winRate - a.winRate)[0];
  const fastest = [...byModel].filter((m) => m.latency > 0).sort((a, b) => a.latency - b.latency)[0];
  const cheapest = [...byModel].filter((m) => m.cost > 0).sort((a, b) => a.cost - b.cost)[0];
  const bestJson = [...byModel].sort((a, b) => b.jsonRate - a.jsonRate)[0];
  return [
    `${top.name} wins most often (${(top.winRate * 100).toFixed(0)}% win rate across all evals).`,
    `${fastest.name} is fastest (${fastest.latency.toFixed(1)}s avg) — prefer it for latency-critical paths.`,
    `${cheapest.name} is cheapest at $${cheapest.cost.toFixed(4)} per run.`,
    `Structured JSON should route to ${bestJson.name} (${(bestJson.jsonRate * 100).toFixed(0)}% validity vs ${(jsonRate * 100).toFixed(0)}% global).`,
  ];
}
