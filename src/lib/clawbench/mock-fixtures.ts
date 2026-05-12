import { generateMockRun, pickWinner, type MockRun } from "./mock-generator";
import { DEFAULT_RULES, MODELS, TASK_TYPES, type TaskType } from "./constants";

export interface MockTask {
  id: string;
  prompt: string;
  task_type: TaskType;
  strategy: string;
  selected_models: string[];
  require_json: boolean;
  timeout_seconds: number | null;
  max_tokens: number | null;
  mode: "mock";
  created_at: string;
  status: string;
}

export interface MockRunRecord extends MockRun {
  id: string;
  task_id: string;
  created_at: string;
}

interface MockBundle {
  task: MockTask;
  runs: MockRunRecord[];
}

// Seeded RNG so the fixture data is stable across reloads.
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const SEED_PROMPTS: { prompt: string; task_type: TaskType; strategy: string }[] = [
  {
    prompt: "Debug intermittent 502s from the OpenClaw Gateway when the agent runner restarts. Provide root cause and a runbook.",
    task_type: "debugging",
    strategy: "best_balance",
  },
  {
    prompt: "Refactor this React data table to use TanStack Query, virtualised rows and optimistic updates.",
    task_type: "coding",
    strategy: "best_quality",
  },
  {
    prompt: "Explain step-by-step how to choose between primary and fallback models for an agentic workflow with strict latency budgets.",
    task_type: "reasoning",
    strategy: "best_quality",
  },
  {
    prompt: "Summarise this 4-page incident postmortem into a 5-bullet exec summary with next actions.",
    task_type: "summarization",
    strategy: "lowest_cost",
  },
  {
    prompt: "Return a strict JSON workflow describing 4 steps with id, owner, action, status fields. No prose.",
    task_type: "structured_json",
    strategy: "best_structured",
  },
  {
    prompt: "Write a product spec for a per-task model router with success metrics, risks and rollout plan.",
    task_type: "product_spec",
    strategy: "best_quality",
  },
  {
    prompt: "Trace why our agent loops on a failing tool call and propose a guard with backoff.",
    task_type: "debugging",
    strategy: "best_quality",
  },
  {
    prompt: "Implement a typed wrapper around fetch with retries, timeout, and structured error reporting in TypeScript.",
    task_type: "coding",
    strategy: "best_balance",
  },
  {
    prompt: "Compare three routing strategies for a code-gen agent and recommend one for a startup with cost constraints.",
    task_type: "reasoning",
    strategy: "best_balance",
  },
  {
    prompt: "Summarise the differences between DeepSeek R1, Kimi K2 and Llama 3.3 70B for an engineering audience.",
    task_type: "summarization",
    strategy: "best_balance",
  },
  {
    prompt: "Emit JSON describing a deployment plan: stages, gates, rollback. No commentary.",
    task_type: "structured_json",
    strategy: "best_structured",
  },
  {
    prompt: "Draft a 1-page product brief for a model leaderboard SaaS targeted at engineering leaders.",
    task_type: "product_spec",
    strategy: "best_quality",
  },
];

const MODEL_IDS = MODELS.map((m) => m.id);

let _bundlesCache: MockBundle[] | null = null;

function buildBundles(): MockBundle[] {
  if (_bundlesCache) return _bundlesCache;
  // Restore Math.random to deterministic for stable fixtures.
  const originalRandom = Math.random;
  const rng = makeRng(42);
  Math.random = rng as () => number;
  try {
    const now = Date.now();
    const bundles: MockBundle[] = SEED_PROMPTS.map((seed, i) => {
      const taskId = `mock-task-${i + 1}`;
      const created = new Date(now - (SEED_PROMPTS.length - i) * 1000 * 60 * 47).toISOString();
      const runs: MockRunRecord[] = MODEL_IDS.map((modelId, j) => {
        const r = generateMockRun(modelId, seed.task_type, seed.prompt);
        return {
          ...r,
          id: `${taskId}-run-${j + 1}`,
          task_id: taskId,
          created_at: created,
        };
      });
      pickWinner(runs as unknown as MockRun[], seed.strategy as never);
      const task: MockTask = {
        id: taskId,
        prompt: seed.prompt,
        task_type: seed.task_type,
        strategy: seed.strategy,
        selected_models: [...MODEL_IDS],
        require_json: seed.task_type === "structured_json",
        timeout_seconds: 60,
        max_tokens: 4096,
        mode: "mock",
        created_at: created,
        status: "completed",
      };
      return { task, runs };
    });
    _bundlesCache = bundles;
    return bundles;
  } finally {
    Math.random = originalRandom;
  }
}

// In-memory store for ad-hoc mock runs created via runEval while mock mode is on.
const _adhocBundles = new Map<string, MockBundle>();

export function listMockBundles(): MockBundle[] {
  return [...buildBundles(), ...Array.from(_adhocBundles.values())].sort(
    (a, b) => +new Date(b.task.created_at) - +new Date(a.task.created_at),
  );
}

export function getMockBundle(taskId: string): MockBundle | null {
  if (_adhocBundles.has(taskId)) return _adhocBundles.get(taskId)!;
  return buildBundles().find((b) => b.task.id === taskId) ?? null;
}

export function listMockRuns(): MockRunRecord[] {
  return listMockBundles().flatMap((b) => b.runs);
}

export function listMockTasks(): MockTask[] {
  return listMockBundles().map((b) => b.task);
}

export function getMockRoutingRules() {
  return DEFAULT_RULES.map((r, i) => ({
    id: `mock-rule-${i + 1}`,
    ...r,
    supporting_eval_count: Math.max(2, listMockBundles().filter((b) => b.task.task_type === r.task_type).length * 3),
    updated_at: new Date().toISOString(),
  }));
}

export function pushAdhocMockBundle(prompt: string, taskType: TaskType, strategy: string, models: string[]) {
  const id = `mock-adhoc-${crypto.randomUUID()}`;
  const created = new Date().toISOString();
  const runs: MockRunRecord[] = models.map((m, j) => {
    const r = generateMockRun(m, taskType, prompt);
    return { ...r, id: `${id}-run-${j + 1}`, task_id: id, created_at: created };
  });
  pickWinner(runs as unknown as MockRun[], strategy as never);
  const task: MockTask = {
    id,
    prompt,
    task_type: taskType,
    strategy,
    selected_models: models,
    require_json: taskType === "structured_json",
    timeout_seconds: 60,
    max_tokens: 4096,
    mode: "mock",
    created_at: created,
    status: "completed",
  };
  const bundle: MockBundle = { task, runs };
  _adhocBundles.set(id, bundle);
  return bundle;
}

// Force the bundle cache to rebuild (e.g. when toggling mock mode).
export function resetMockCache() {
  _bundlesCache = null;
  _adhocBundles.clear();
}

// Reference to silence "unused" if TASK_TYPES tree-shakes oddly during dev.
void TASK_TYPES;
