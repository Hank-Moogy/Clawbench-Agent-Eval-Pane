import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { exportDataset, getAllRuns } from "@/lib/api/clawbench";
import { PageHeader } from "@/components/clawbench/page-header";
import { MetricCard } from "@/components/clawbench/atoms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS, TASK_TYPES } from "@/lib/clawbench/constants";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/export")({ component: ExportPage });

function ExportPage() {
  const { data: runs = [] } = useQuery({ queryKey: ["all-runs"], queryFn: getAllRuns });
  const winners = useMemo(
    () => runs.filter((r: any) => r.is_winner && r.reliability_status === "completed"),
    [runs],
  );

  const [taskType, setTaskType] = useState("");
  const [model, setModel] = useState("");
  const [minScore, setMinScore] = useState("");
  const [jsonOnly, setJsonOnly] = useState(false);
  const [format, setFormat] = useState<"jsonl" | "csv" | "json">("jsonl");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = winners.filter((r: any) => {
    if (taskType && r.eval_tasks?.task_type !== taskType) return false;
    if (model && r.model_id !== model) return false;
    if (minScore && (r.quality_score ?? 0) < +minScore) return false;
    if (jsonOnly && !r.json_valid) return false;
    return true;
  });

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r: any) => r.id)));
  };

  const selectedRuns = filtered.filter((r: any) => selected.has(r.id));
  const preview = useMemo(() => {
    if (format !== "jsonl") return "";
    return selectedRuns
      .slice(0, 3)
      .map((r: any) =>
        JSON.stringify(
          {
            messages: [
              { role: "system", content: "You are an OpenClaw agent optimized for technical execution." },
              { role: "user", content: r.eval_tasks?.prompt },
              { role: "assistant", content: (r.output ?? "").slice(0, 200) + "…" },
            ],
            metadata: { task_type: r.eval_tasks?.task_type, winner_model: r.model_id, quality_score: r.quality_score },
          },
        ),
      )
      .join("\n");
  }, [selectedRuns, format]);

  const avgQ = selectedRuns.length
    ? selectedRuns.reduce((s: number, r: any) => s + (r.quality_score ?? 0), 0) / selectedRuns.length
    : 0;
  const taskTypes = new Set(selectedRuns.map((r: any) => r.eval_tasks?.task_type));
  const modelsRep = new Set(selectedRuns.map((r: any) => r.model_id));
  const jsonValidCount = selectedRuns.filter((r: any) => r.json_valid).length;

  const doExport = async () => {
    if (selected.size === 0) return toast.error("Select at least one run");
    const { body } = await exportDataset({ runIds: Array.from(selected), format });
    const blob = new Blob([body], { type: format === "jsonl" ? "application/jsonl" : format === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clawbench-export-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.size} examples`);
  };

  const copyPreview = async () => {
    const { body } = await exportDataset({ runIds: Array.from(selected), format });
    navigator.clipboard.writeText(body);
    toast.success("JSONL copied");
  };

  return (
    <div>
      <PageHeader
        title="Dataset Export"
        subtitle="Export winning model outputs as training examples for future post-training or fine-tuning."
      />
      <div className="space-y-5 p-6">
        <div className="grid gap-3 md:grid-cols-5">
          <MetricCard label="Selected" value={selected.size} />
          <MetricCard label="Avg quality" value={avgQ.toFixed(2)} accent="primary" />
          <MetricCard label="Task types" value={taskTypes.size} />
          <MetricCard label="Models" value={modelsRep.size} />
          <MetricCard label="JSON valid" value={jsonValidCount} />
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-5">
          <FilterSelect label="Task type" value={taskType} onChange={setTaskType} options={TASK_TYPES.map((t) => ({ v: t.id, l: t.label }))} />
          <FilterSelect label="Winning model" value={model} onChange={setModel} options={MODELS.map((m) => ({ v: m.id, l: m.name }))} />
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Min quality</label>
            <Input type="number" step="0.1" value={minScore} onChange={(e) => setMinScore(e.target.value)} className="mt-1.5" placeholder="e.g. 4.0" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">JSON valid only</label>
            <div className="mt-2.5"><Checkbox checked={jsonOnly} onCheckedChange={(v) => setJsonOnly(!!v)} /></div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Format</label>
            <Select value={format} onValueChange={(v) => setFormat(v as any)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="jsonl">JSONL (chat)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">Raw JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></th>
                  {["Prompt", "Winner", "Quality", "Task", "Out tok", "Created"].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2"><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} /></td>
                    <td className="px-3 py-2 max-w-xs truncate" title={r.eval_tasks?.prompt}>{r.eval_tasks?.prompt}</td>
                    <td className="px-3 py-2">{r.model_display_name}</td>
                    <td className="px-3 py-2">{r.quality_score?.toFixed(2)}</td>
                    <td className="px-3 py-2">{r.eval_tasks?.task_type}</td>
                    <td className="px-3 py-2">{r.output_tokens ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">No winning runs match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Preview ({format})</div>
            <pre className="mt-2 max-h-80 overflow-auto rounded-md border border-border bg-background p-3 font-mono text-[10px] leading-relaxed text-foreground/80">
              {preview || "(select runs to preview)"}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={doExport} disabled={selected.size === 0} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export selected
              </Button>
              <Button size="sm" variant="outline" onClick={copyPreview} disabled={selected.size === 0} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copy {format.toUpperCase()}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toast.success("Marked as training-ready")} disabled={selected.size === 0}>
                Mark training-ready
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
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
