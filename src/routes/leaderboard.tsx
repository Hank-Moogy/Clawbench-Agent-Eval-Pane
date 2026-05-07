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
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { MODELS, MODEL_COLORS, TASK_TYPES } from "@/lib/clawbench/constants";

export const Route = createFileRoute("/leaderboard")({ component: LeaderboardPage });

interface Agg {
  model_id: string;
  model_display_name: string;
  task_type: string;
  count: number;
  wins: number;
  q: number;
  correctness: number;
  actionability: number;
  format: number;
  latency: number;
  cost: number;
  efficiency: number;
  jsonValid: number;
  failures: number;
}

function aggregate(runs: any[]): Agg[] {
  const map = new Map<string, Agg>();
  for (const r of runs) {
    const tt = r.eval_tasks?.task_type ?? "unknown";
    const key = `${r.model_id}::${tt}`;
    const a = map.get(key) ?? {
      model_id: r.model_id,
      model_display_name: r.model_display_name ?? r.model_id,
      task_type: tt,
      count: 0,
      wins: 0,
      q: 0,
      correctness: 0,
      actionability: 0,
      format: 0,
      latency: 0,
      cost: 0,
      efficiency: 0,
      jsonValid: 0,
      failures: 0,
    };
    a.count++;
    if (r.is_winner) a.wins++;
    if (r.reliability_status !== "completed") a.failures++;
    if (r.quality_score != null) a.q += r.quality_score;
    if (r.correctness != null) a.correctness += r.correctness;
    if (r.actionability != null) a.actionability += r.actionability;
    if (r.format_reliability != null) a.format += r.format_reliability;
    if (r.latency_ms != null) a.latency += r.latency_ms;
    if (r.estimated_cost != null) a.cost += r.estimated_cost;
    if (r.efficiency_score != null) a.efficiency += r.efficiency_score;
    if (r.json_valid) a.jsonValid++;
    map.set(key, a);
  }
  return Array.from(map.values());
}

function avg(a: Agg, k: keyof Agg) {
  const c = a.count - a.failures;
  return c > 0 ? (a[k] as number) / c : 0;
}

function LeaderboardPage() {
  const { data: runs = [], isLoading } = useQuery({ queryKey: ["all-runs"], queryFn: getAllRuns });
  const aggs = aggregate(runs);

  // by-model totals
  const byModel = MODELS.map((m) => {
    const list = aggs.filter((a) => a.model_id === m.id);
    const count = list.reduce((s, a) => s + a.count, 0);
    const wins = list.reduce((s, a) => s + a.wins, 0);
    const completed = list.reduce((s, a) => s + (a.count - a.failures), 0) || 1;
    return {
      id: m.id,
      name: m.name,
      count,
      wins,
      winRate: count > 0 ? wins / count : 0,
      avgQuality: list.reduce((s, a) => s + a.q, 0) / completed,
      avgLatency: list.reduce((s, a) => s + a.latency, 0) / completed,
      avgCost: list.reduce((s, a) => s + a.cost, 0) / completed,
      avgEff: list.reduce((s, a) => s + a.efficiency, 0) / completed,
      jsonRate: list.reduce((s, a) => s + a.jsonValid, 0) / (count || 1),
    };
  });

  const overallWinner = byModel.reduce((a, b) => (b.wins > a.wins ? b : a), byModel[0]);
  const fastest = byModel.reduce((a, b) => (b.avgLatency > 0 && b.avgLatency < a.avgLatency ? b : a), byModel[0]);
  const cheapest = byModel.reduce((a, b) => (b.avgCost > 0 && b.avgCost < a.avgCost ? b : a), byModel[0]);
  const bestStruct = byModel.reduce((a, b) => (b.jsonRate > a.jsonRate ? b : a), byModel[0]);
  const bestBalance = byModel.reduce((a, b) => (b.avgEff > a.avgEff ? b : a), byModel[0]);

  const scatterData = runs
    .filter((r) => r.reliability_status === "completed")
    .map((r) => ({
      x: r.estimated_cost,
      y: r.quality_score,
      z: 1,
      model: r.model_id,
    }));

  return (
    <div>
      <PageHeader title="Model Leaderboard" subtitle="Aggregated performance across all eval runs." />
      <div className="space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-5">
          <MetricCard label="Overall winner" value={overallWinner?.name ?? "—"} hint={`${overallWinner?.wins ?? 0} wins`} accent="primary" />
          <MetricCard label="Fastest" value={fastest?.name ?? "—"} hint={`${(fastest?.avgLatency / 1000).toFixed(1)}s avg`} />
          <MetricCard label="Lowest cost" value={cheapest?.name ?? "—"} hint={`$${cheapest?.avgCost.toFixed(4)} avg`} />
          <MetricCard label="Best structured" value={bestStruct?.name ?? "—"} hint={`${(bestStruct?.jsonRate * 100).toFixed(0)}% JSON valid`} />
          <MetricCard label="Best cost-quality" value={bestBalance?.name ?? "—"} hint={`Eff ${bestBalance?.avgEff.toFixed(0)}/100`} />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">By task type</div>
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Task", "Model", "Evals", "Win rate", "Quality", "Correct.", "Action.", "Format", "Latency", "Cost", "Efficiency", "JSON valid", "Role"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {TASK_TYPES.flatMap((tt) => {
                const list = aggs.filter((a) => a.task_type === tt.id);
                const top = list.reduce<Agg | null>((a, b) => (!a || b.wins > a.wins ? b : a), null);
                return list.map((a, i) => (
                  <tr key={a.task_type + a.model_id} className="border-t border-border">
                    {i === 0 && <td className="px-3 py-2 align-top" rowSpan={list.length}><span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[11px]">{tt.label}</span></td>}
                    <td className="px-3 py-2">{a.model_display_name}</td>
                    <td className="px-3 py-2">{a.count}</td>
                    <td className="px-3 py-2">{((a.wins / a.count) * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2">{avg(a, "q").toFixed(2)}</td>
                    <td className="px-3 py-2">{avg(a, "correctness").toFixed(2)}</td>
                    <td className="px-3 py-2">{avg(a, "actionability").toFixed(2)}</td>
                    <td className="px-3 py-2">{avg(a, "format").toFixed(2)}</td>
                    <td className="px-3 py-2">{(avg(a, "latency") / 1000).toFixed(1)}s</td>
                    <td className="px-3 py-2">${avg(a, "cost").toFixed(4)}</td>
                    <td className="px-3 py-2">{avg(a, "efficiency").toFixed(0)}</td>
                    <td className="px-3 py-2">{((a.jsonValid / a.count) * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2">
                      <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {top?.model_id === a.model_id ? "Primary" : "Fallback"}
                      </span>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Win rate by model">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byModel.map((m) => ({ name: m.name, v: +(m.winRate * 100).toFixed(1) }))} margin={{ left: -20 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                  {byModel.map((m) => <Cell key={m.id} fill={MODEL_COLORS[m.id]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Average quality by model">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byModel.map((m) => ({ name: m.name, v: +m.avgQuality.toFixed(2) }))} margin={{ left: -20 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                  {byModel.map((m) => <Cell key={m.id} fill={MODEL_COLORS[m.id]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Average latency by model (s)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byModel.map((m) => ({ name: m.name, v: +(m.avgLatency / 1000).toFixed(1) }))} margin={{ left: -20 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                  {byModel.map((m) => <Cell key={m.id} fill={MODEL_COLORS[m.id]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Cost vs quality (per run)">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.3 0.015 260)" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="cost" tickFormatter={(v) => `$${v.toFixed(3)}`} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis type="number" dataKey="y" name="quality" domain={[3, 5]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <ZAxis range={[40, 80]} />
                <Tooltip contentStyle={tooltipStyle} />
                {MODELS.map((m) => (
                  <Scatter key={m.id} name={m.name} data={scatterData.filter((d) => d.model === m.id)} fill={MODEL_COLORS[m.id]} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
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
