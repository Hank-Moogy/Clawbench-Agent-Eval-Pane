import { MODELS, type ModelId, type Strategy, type TaskType } from "./constants";

type Range = {
  quality: [number, number];
  latencyMs: [number, number];
  cost: [number, number];
  jsonValid: number;
  failure: number;
};
const DEFAULT_RANGE: Range = { quality: [3.8, 4.5], latencyMs: [6000, 14000], cost: [0.002, 0.006], jsonValid: 0.85, failure: 0.04 };
const RANGES: Record<string, Range> = {
  kimi: { quality: [4.1, 4.8], latencyMs: [7000, 11000], cost: [0.0025, 0.0045], jsonValid: 0.9, failure: 0.03 },
  deepseek: { quality: [4.4, 4.9], latencyMs: [12000, 22000], cost: [0.005, 0.010], jsonValid: 0.85, failure: 0.05 },
  llama70b: { quality: [3.5, 4.3], latencyMs: [4000, 8000], cost: [0.0015, 0.003], jsonValid: 0.8, failure: 0.04 },
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function modelDisplayName(id: string, names?: Record<string, string>) {
  return names?.[id] ?? MODELS.find((m) => m.id === id)?.name ?? id;
}

function mockOutput(model: ModelId, taskType: TaskType, prompt: string) {
  const head = `// model: ${model} • task: ${taskType}\n`;
  const promptLine = `// prompt: ${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}\n\n`;
  switch (taskType) {
    case "debugging":
      return head + promptLine + `Root cause:\n  • Token rotation drift between Gateway and Runner.\n\nFix:\n  $ openclaw auth refresh --tunnel\n  $ kubectl rollout restart deploy/agent-runner\n  $ openclaw verify --token $OPENCLAW_TOKEN\n\nValidation:\n  • /health returns 200 within 30s\n  • run-eval echoes new token claim\n\nRollback:\n  • Re-export prior token from secrets vault and restart runner.`;
    case "coding":
      return head + promptLine + "```ts\nexport async function runEval(payload: Payload) {\n  const start = performance.now();\n  const res = await fetch(`${API}/run-eval`, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(payload),\n  });\n  if (!res.ok) throw new Error(`runEval failed: ${res.status}`);\n  return { ...(await res.json()), latency_ms: performance.now() - start };\n}\n```";
    case "reasoning":
      return head + promptLine + `Step 1 — Constraints: latency budget, accuracy floor, cost ceiling.\nStep 2 — Trade space: greedy vs balanced vs accuracy-max.\nStep 3 — Decision: route by task signature; escalate on confidence drop.\nStep 4 — Validation: golden eval set + live A/B sample.`;
    case "summarization":
      return head + promptLine + `Summary:\n  • Incident: token mismatch caused 4xx spike at 14:02 UTC.\n  • Detection: synthetic probe in 90s.\n  • Mitigation: token rotation + restart in 6 min.\n  • Next steps: add token-drift alert, codify rotation runbook.`;
    case "structured_json":
      return JSON.stringify(
        {
          workflow: "agent-eval",
          steps: [
            { id: 1, owner: "kimi", action: "draft", status: "ok" },
            { id: 2, owner: "deepseek", action: "review", status: "ok" },
            { id: 3, owner: "llama70b", action: "ship", status: "pending" },
          ],
          metadata: { model, taskType },
        },
        null,
        2,
      );
    case "product_spec":
      return head + promptLine + `# Product Spec\n\n## Problem\nOperators need a per-task model picker grounded in real evals.\n\n## Solution\nClawBench runs the same prompt across models, scores outputs, and emits routing rules.\n\n## Success metrics\n- Win rate stability per task type\n- Cost-per-quality reduction ≥ 25%\n- JSON validity rate ≥ 95% on structured tasks`;
  }
}

export interface MockRun {
  model_id: ModelId;
  model_display_name: string;
  output: string | null;
  quality_score: number | null;
  correctness: number | null;
  completeness: number | null;
  actionability: number | null;
  format_reliability: number | null;
  agent_utility: number | null;
  efficiency_score: number | null;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  estimated_cost: number | null;
  cost_per_quality_point: number | null;
  reliability_status: "completed" | "failed" | "timeout" | "invalid_output";
  json_valid: boolean | null;
  judge_explanation: string | null;
  status: string;
  is_winner: boolean;
  recommendation_reason: string | null;
}

export function generateMockRun(
  modelId: ModelId,
  taskType: TaskType,
  prompt: string,
  modelNames?: Record<string, string>,
  forceRequireJson = false,
): MockRun {
  const r = RANGES[modelId];
  const failed = Math.random() < r.failure;
  const display = modelDisplayName(modelId, modelNames);

  if (failed) {
    const status = Math.random() < 0.5 ? "timeout" : "failed";
    return {
      model_id: modelId,
      model_display_name: display,
      output: null,
      quality_score: null,
      correctness: null,
      completeness: null,
      actionability: null,
      format_reliability: null,
      agent_utility: null,
      efficiency_score: null,
      latency_ms: status === "timeout" ? r.latencyMs[1] + 5000 : null,
      input_tokens: null,
      output_tokens: null,
      total_tokens: null,
      estimated_cost: null,
      cost_per_quality_point: null,
      reliability_status: status as "failed" | "timeout",
      json_valid: false,
      judge_explanation: null,
      status,
      is_winner: false,
      recommendation_reason: null,
    };
  }

  const quality = +rand(r.quality[0], r.quality[1]).toFixed(2);
  const correctness = +Math.min(5, quality + rand(-0.3, 0.3)).toFixed(2);
  const completeness = +Math.min(5, quality + rand(-0.4, 0.2)).toFixed(2);
  const actionability = +Math.min(5, quality + rand(-0.5, 0.3)).toFixed(2);
  const format = +Math.min(5, quality + rand(-0.6, 0.2)).toFixed(2);
  const agent = +Math.min(5, quality + rand(-0.4, 0.4)).toFixed(2);
  const latency = randInt(r.latencyMs[0], r.latencyMs[1]);
  const cost = +rand(r.cost[0], r.cost[1]).toFixed(4);
  const inputTokens = randInt(800, 1600);
  const outputTokens = randInt(1200, 3200);
  const totalTokens = inputTokens + outputTokens;
  const efficiency = quality / (cost * 1000 + (latency / 1000) * 0.05);
  const efficiencyScaled = +Math.min(100, Math.max(0, efficiency * 18)).toFixed(1);
  const cpq = +(cost / quality).toFixed(5);
  const jsonValid =
    taskType === "structured_json" || forceRequireJson
      ? Math.random() < r.jsonValid
      : Math.random() < (r.jsonValid + 0.05);

  const output = mockOutput(modelId, taskType, prompt);

  const judge =
    `${display} produced a ${quality >= 4.5 ? "strong" : quality >= 4 ? "solid" : "adequate"} response. ` +
    `Correctness ${correctness.toFixed(1)}/5, actionability ${actionability.toFixed(1)}/5. ` +
    (jsonValid ? "Output structure parsed cleanly." : "Format reliability could be improved.");

  return {
    model_id: modelId,
    model_display_name: display,
    output,
    quality_score: quality,
    correctness,
    completeness,
    actionability,
    format_reliability: format,
    agent_utility: agent,
    efficiency_score: efficiencyScaled,
    latency_ms: latency,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    estimated_cost: cost,
    cost_per_quality_point: cpq,
    reliability_status: "completed",
    json_valid: jsonValid,
    judge_explanation: judge,
    status: "completed",
    is_winner: false,
    recommendation_reason: null,
  };
}

export function pickWinner(runs: MockRun[], strategy: Strategy): MockRun | null {
  const completed = runs.filter((r) => r.reliability_status === "completed");
  if (completed.length === 0) return null;
  let chosen: MockRun = completed[0];
  switch (strategy) {
    case "best_quality":
      chosen = completed.reduce((a, b) => (b.quality_score! > a.quality_score! ? b : a));
      break;
    case "lowest_latency":
      chosen = completed.reduce((a, b) => (b.latency_ms! < a.latency_ms! ? b : a));
      break;
    case "lowest_cost":
      chosen = completed.reduce((a, b) => (b.estimated_cost! < a.estimated_cost! ? b : a));
      break;
    case "best_balance":
      chosen = completed.reduce((a, b) => (b.efficiency_score! > a.efficiency_score! ? b : a));
      break;
    case "best_structured": {
      const valid = completed.filter((r) => r.json_valid);
      const pool = valid.length ? valid : completed;
      chosen = pool.reduce((a, b) => (b.format_reliability! > a.format_reliability! ? b : a));
      break;
    }
  }
  chosen.is_winner = true;
  chosen.recommendation_reason = recommendationReason(chosen, strategy);
  return chosen;
}

function recommendationReason(w: MockRun, strategy: Strategy) {
  const name = w.model_display_name;
  const lat = ((w.latency_ms ?? 0) / 1000).toFixed(1);
  const q = w.quality_score?.toFixed(1);
  const c = w.estimated_cost?.toFixed(4);
  switch (strategy) {
    case "best_quality":
      return `${name} won on quality with ${q}/5 — strongest correctness and completeness across runs.`;
    case "lowest_latency":
      return `${name} returned in ${lat}s while keeping quality at ${q}/5.`;
    case "lowest_cost":
      return `${name} delivered the lowest estimated cost at $${c} with quality ${q}/5.`;
    case "best_balance":
      return `${name} had the best cost-quality balance: efficiency ${w.efficiency_score}/100 at $${c} and ${lat}s.`;
    case "best_structured":
      return `${name} produced the most reliable structured output (format ${w.format_reliability?.toFixed(1)}/5${w.json_valid ? ", JSON valid" : ""}).`;
  }
}
