import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/clawbench/page-header";
import { EXAMPLE_PROMPTS, MODELS, NEBIUS_CATALOG, STRATEGIES, TASK_TYPES, type ModelId, type Strategy, type TaskType } from "@/lib/clawbench/constants";
import { runEval } from "@/lib/api/clawbench";
import { CheckCircle2, Loader2, PlayCircle, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: RunEvalPage });

const STEPS = [
  "Preparing task",
  "Switching model",
  "Running agent loop",
  "Collecting output",
  "Scoring response",
  "Generating routing recommendation",
];

function RunEvalPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("debugging");
  const [strategy, setStrategy] = useState<Strategy>("best_balance");
  const [models, setModels] = useState<ModelId[]>(["kimi", "deepseek", "llama70b"]);
  const [requireJson, setRequireJson] = useState(false);
  const [timeout, setTimeoutSec] = useState(60);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [judgeModel, setJudgeModel] = useState("deepseek");
  const [autoSave, setAutoSave] = useState(true);
  const [step, setStep] = useState(-1);

  const mut = useMutation({
    mutationFn: async () => {
      // simulate progress UI
      for (let i = 0; i < STEPS.length; i++) {
        setStep(i);
        await new Promise((r) => setTimeout(r, 350 + Math.random() * 400));
      }
      const { taskId } = await runEval({
        prompt,
        task_type: taskType,
        strategy,
        selected_models: models,
        require_json: requireJson,
        timeout_seconds: timeout,
        max_tokens: maxTokens,
      });
      return taskId;
    },
    onSuccess: (taskId) => {
      toast.success("Eval complete", { description: "Routing recommendation generated." });
      navigate({ to: "/eval/$taskId", params: { taskId } });
    },
    onError: (e: Error) => {
      setStep(-1);
      toast.error("Eval failed", { description: e.message });
    },
  });

  const toggleModel = (id: ModelId) =>
    setModels((cur) => (cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]));

  const isRunning = mut.isPending;

  return (
    <div>
      <PageHeader
        title="Run Agent Eval"
        subtitle="Benchmark OpenClaw tasks across Nebius Token Factory models."
        actions={
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            Real mode
          </Badge>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Debug this OpenClaw Gateway token mismatch and provide terminal commands to fix it."
              className="mt-2 min-h-32 font-mono text-sm"
              disabled={isRunning}
            />

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Task type</Label>
                <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)} disabled={isRunning}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Eval strategy</Label>
                <Select value={strategy} onValueChange={(v) => setStrategy(v as Strategy)} disabled={isRunning}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STRATEGIES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Models</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {MODELS.map((m) => {
                  const active = models.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isRunning}
                      onClick={() => toggleModel(m.id)}
                      className={`rounded-md border p-3 text-left transition ${
                        active
                          ? "border-primary/60 bg-primary/10"
                          : "border-border bg-background hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{m.name}</span>
                        {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{m.positioning}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Accordion type="single" collapsible className="mt-5">
              <AccordionItem value="adv">
                <AccordionTrigger className="text-xs uppercase tracking-wider text-muted-foreground">
                  Advanced settings
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-2 md:grid-cols-2">
                    <div>
                      <Label className="text-xs">Timeout (seconds)</Label>
                      <Input type="number" value={timeout} onChange={(e) => setTimeoutSec(+e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs">Max output tokens</Label>
                      <Input type="number" value={maxTokens} onChange={(e) => setMaxTokens(+e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs">Judge model</Label>
                      <Select value={judgeModel} onValueChange={setJudgeModel}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                      <Label className="text-xs">Require JSON output</Label>
                      <Switch checked={requireJson} onCheckedChange={setRequireJson} />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                      <Label className="text-xs">Save result automatically</Label>
                      <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-6 flex items-center gap-2">
              <Button
                onClick={() => mut.mutate()}
                disabled={isRunning || !prompt.trim() || models.length === 0}
                className="gap-2"
              >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                Run Eval
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPrompt("");
                  setStep(-1);
                }}
                disabled={isRunning}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            </div>
          </div>

          {isRunning && (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Running OpenClaw agent loops across selected models…
              </div>
              <div className="mt-4 grid gap-2">
                {models.map((m) => {
                  const name = MODELS.find((x) => x.id === m)?.name;
                  return (
                    <div key={m} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 font-mono text-xs">
                      <span>{name}</span>
                      <span className="text-muted-foreground">Running agent loop…</span>
                    </div>
                  );
                })}
              </div>
              <ol className="mt-5 grid gap-1.5">
                {STEPS.map((s, i) => (
                  <li key={s} className={`flex items-center gap-2 text-xs ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${i < step ? "border-primary bg-primary/20 text-primary" : i === step ? "border-primary text-primary" : "border-border"}`}>
                      {i < step ? "✓" : i === step ? "•" : ""}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Configuration</div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Task type" v={TASK_TYPES.find((t) => t.id === taskType)?.label} />
              <Row k="Strategy" v={STRATEGIES.find((s) => s.id === strategy)?.label} />
              <Row k="Models" v={`${models.length} selected`} />
              <Row k="Estimated runs" v={models.length.toString()} />
              <Row k="API mode" v="Real" />
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Example prompts
            </div>
            <div className="mt-3 grid gap-2">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setPrompt(p)}
                  className="rounded-md border border-border bg-background p-2.5 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-border/60 pb-1.5 last:border-0">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-mono text-xs">{v}</dd>
    </div>
  );
}
