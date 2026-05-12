import { supabase } from "@/integrations/supabase/client";
import { pickWinner, type MockRun } from "@/lib/clawbench/mock-generator";
import { DEFAULT_RULES, MODELS, type ModelId, type Strategy, type TaskType } from "@/lib/clawbench/constants";
import { isMockMode } from "@/lib/clawbench/mock-mode";
import {
  getMockBundle,
  getMockRoutingRules,
  listMockBundles,
  listMockRuns,
  pushAdhocMockBundle,
} from "@/lib/clawbench/mock-fixtures";

export interface RunEvalPayload {
  prompt: string;
  task_type: TaskType;
  strategy: Strategy;
  selected_models: ModelId[];
  require_json?: boolean;
  timeout_seconds?: number;
  max_tokens?: number;
}

export interface AppSettings {
  id: string;
  api_mode: "mock" | "real";
  agent_runner_api_url: string | null;
  model_display_names: Record<string, string>;
}

let _settingsCache: AppSettings | null = null;

export async function getSettings(): Promise<AppSettings> {
  if (_settingsCache) return _settingsCache;
  const { data } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
  if (data) {
    _settingsCache = data as unknown as AppSettings;
    return _settingsCache;
  }
  const { data: created } = await supabase
    .from("app_settings")
    .insert({ api_mode: "real" })
    .select("*")
    .single();
  _settingsCache = created as unknown as AppSettings;
  return _settingsCache!;
}

export async function saveSettings(patch: Partial<Omit<AppSettings, "id">>) {
  const cur = await getSettings();
  const { data } = await supabase
    .from("app_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", cur.id)
    .select("*")
    .single();
  _settingsCache = data as unknown as AppSettings;
  return _settingsCache!;
}

export async function testConnection(url: string, _mode?: "mock" | "real") {
  if (!url) return { ok: false, message: "No Agent Runner API URL configured." };
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/health`, { method: "GET" });
    return { ok: res.ok, message: res.ok ? `Connected (${res.status})` : `Status ${res.status}` };
  } catch (e: unknown) {
    return { ok: false, message: e instanceof Error ? e.message : "Connection failed" };
  }
}

export async function runEval(payload: RunEvalPayload): Promise<{ taskId: string }> {
  if (isMockMode()) {
    const bundle = pushAdhocMockBundle(
      payload.prompt,
      payload.task_type,
      payload.strategy,
      payload.selected_models,
    );
    return { taskId: bundle.task.id };
  }

  const settings = await getSettings();
  const mode = settings.api_mode;

  // 1. Insert task
  const { data: task, error: taskErr } = await supabase
    .from("eval_tasks")
    .insert({
      prompt: payload.prompt,
      task_type: payload.task_type,
      strategy: payload.strategy,
      selected_models: payload.selected_models,
      require_json: payload.require_json ?? false,
      timeout_seconds: payload.timeout_seconds ?? null,
      max_tokens: payload.max_tokens ?? null,
      mode,
    })
    .select("*")
    .single();
  if (taskErr || !task) throw taskErr ?? new Error("Failed to create task");

  // 2. Call the real Agent Runner API
  if (!settings.agent_runner_api_url) {
    throw new Error("Agent Runner API URL not configured. Set it in Settings.");
  }
  const res = await fetch(`${settings.agent_runner_api_url.replace(/\/$/, "")}/run-eval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Agent Runner returned ${res.status}`);
  const runs = (await res.json()).runs as MockRun[];

  pickWinner(runs, payload.strategy);

  // 3. Insert runs
  const rows = runs.map((r) => ({ ...r, task_id: task.id }));
  const { error: runsErr } = await supabase.from("eval_runs").insert(rows);
  if (runsErr) throw runsErr;

  return { taskId: task.id };
}

export async function getEvalById(id: string) {
  if (isMockMode()) {
    const b = getMockBundle(id);
    if (b) {
      return {
        task: b.task,
        runs: [...b.runs].sort((x, y) => Number(y.is_winner) - Number(x.is_winner)),
      };
    }
  }
  const { data: task } = await supabase.from("eval_tasks").select("*").eq("id", id).maybeSingle();
  const { data: runs } = await supabase
    .from("eval_runs")
    .select("*")
    .eq("task_id", id)
    .order("is_winner", { ascending: false });
  return { task, runs: runs ?? [] };
}

export interface HistoryFilters {
  task_type?: string;
  winning_model?: string;
  strategy?: string;
  status?: string;
  min_score?: number;
}

export async function getEvalHistory(filters: HistoryFilters = {}) {
  let q = supabase.from("eval_tasks").select("*, eval_runs(*)").order("created_at", { ascending: false }).limit(200);
  if (filters.task_type) q = q.eq("task_type", filters.task_type);
  if (filters.strategy) q = q.eq("strategy", filters.strategy);
  const { data } = await q;
  let rows = (data ?? []).map((t: any) => {
    const winner = (t.eval_runs ?? []).find((r: any) => r.is_winner) ?? null;
    const completed = (t.eval_runs ?? []).filter((r: any) => r.reliability_status === "completed");
    const avgLatency = completed.length
      ? Math.round(completed.reduce((s: number, r: any) => s + (r.latency_ms ?? 0), 0) / completed.length)
      : null;
    const totalCost = (t.eval_runs ?? []).reduce((s: number, r: any) => s + (r.estimated_cost ?? 0), 0);
    return { task: t, winner, avgLatency, totalCost };
  });
  if (filters.winning_model) rows = rows.filter((r) => r.winner?.model_id === filters.winning_model);
  if (filters.status) rows = rows.filter((r) => r.winner?.reliability_status === filters.status);
  if (filters.min_score) rows = rows.filter((r) => (r.winner?.quality_score ?? 0) >= filters.min_score!);
  return rows;
}

export async function getAllRuns() {
  const { data } = await supabase.from("eval_runs").select("*, eval_tasks(task_type, prompt, strategy, created_at)");
  return data ?? [];
}

export async function getRoutingRules() {
  const { data } = await supabase.from("routing_rules").select("*").order("task_type");
  return data ?? [];
}

export async function saveRoutingRule(rule: any) {
  const payload = { ...rule, updated_at: new Date().toISOString() };
  if (rule.id) {
    const { data } = await supabase.from("routing_rules").update(payload).eq("id", rule.id).select("*").single();
    return data;
  }
  const { data } = await supabase.from("routing_rules").insert(payload).select("*").single();
  return data;
}

export async function deleteRoutingRule(id: string) {
  await supabase.from("routing_rules").delete().eq("id", id);
}

export async function exportDataset(opts: { runIds: string[]; format: "jsonl" | "csv" | "json"; name?: string }) {
  const { data: runs } = await supabase
    .from("eval_runs")
    .select("*, eval_tasks(prompt, task_type, strategy)")
    .in("id", opts.runIds);
  const list = runs ?? [];
  let body = "";
  if (opts.format === "jsonl") {
    body = list
      .map((r: any) =>
        JSON.stringify({
          messages: [
            { role: "system", content: "You are an OpenClaw agent optimized for technical execution." },
            { role: "user", content: r.eval_tasks?.prompt ?? "" },
            { role: "assistant", content: r.output ?? "" },
          ],
          metadata: {
            task_type: r.eval_tasks?.task_type,
            winner_model: r.model_id,
            quality_score: r.quality_score,
          },
        }),
      )
      .join("\n");
  } else if (opts.format === "csv") {
    body =
      "task_type,winner_model,quality_score,prompt,output\n" +
      list
        .map(
          (r: any) =>
            `${r.eval_tasks?.task_type},${r.model_id},${r.quality_score},"${(r.eval_tasks?.prompt ?? "").replace(/"/g, '""')}","${(r.output ?? "").replace(/"/g, '""').slice(0, 500)}"`,
        )
        .join("\n");
  } else {
    body = JSON.stringify(list, null, 2);
  }
  const avg =
    list.length > 0
      ? +(list.reduce((s: number, r: any) => s + (r.quality_score ?? 0), 0) / list.length).toFixed(2)
      : 0;
  const { data: rec } = await supabase
    .from("dataset_exports")
    .insert({
      name: opts.name ?? `Export ${new Date().toISOString().slice(0, 16)}`,
      format: opts.format,
      selected_run_ids: opts.runIds,
      jsonl_preview: body.slice(0, 4000),
      example_count: list.length,
      avg_quality_score: avg,
    })
    .select("*")
    .single();
  return { body, export: rec };
}

export async function ensureSeed() {
  const { count } = await supabase.from("eval_tasks").select("id", { count: "exact", head: true });
  const { count: rulesCount } = await supabase
    .from("routing_rules")
    .select("id", { count: "exact", head: true });

  if ((rulesCount ?? 0) === 0) {
    await supabase.from("routing_rules").insert(
      DEFAULT_RULES.map((r: typeof DEFAULT_RULES[number]) => ({ ...r, supporting_eval_count: 0 })),
    );
  }

  // Mock eval task seeding disabled — only real Agent Runner data is used.
  void count;
}
