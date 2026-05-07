export const MODELS = [
  { id: "kimi", name: "Kimi K2.5", positioning: "Strong general agent, great cost-quality balance" },
  { id: "deepseek", name: "DeepSeek R1", positioning: "Strong reasoning, slower but higher quality" },
  { id: "llama70b", name: "Llama 3.3 70B", positioning: "Fast general baseline, low cost" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export const TASK_TYPES = [
  { id: "debugging", label: "Debugging" },
  { id: "coding", label: "Coding" },
  { id: "reasoning", label: "Reasoning" },
  { id: "summarization", label: "Summarization" },
  { id: "structured_json", label: "Structured JSON" },
  { id: "product_spec", label: "Product Spec" },
] as const;

export type TaskType = (typeof TASK_TYPES)[number]["id"];

export const STRATEGIES = [
  { id: "best_quality", label: "Best quality" },
  { id: "lowest_latency", label: "Lowest latency" },
  { id: "lowest_cost", label: "Lowest estimated cost" },
  { id: "best_balance", label: "Best cost-quality balance" },
  { id: "best_structured", label: "Best structured output reliability" },
] as const;

export type Strategy = (typeof STRATEGIES)[number]["id"];

export const MODEL_COLORS: Record<string, string> = {
  kimi: "var(--chart-1)",
  deepseek: "var(--chart-2)",
  llama70b: "var(--chart-3)",
};

export const EXAMPLE_PROMPTS = [
  "Debug this OpenClaw Gateway token mismatch and provide terminal commands to fix it.",
  "Create a technical implementation plan for a Lovable app with auth and Stripe payments.",
  "Summarize this incident report and propose next steps for the on-call engineer.",
  "Generate a strict JSON response describing a workflow with steps, owner, and status.",
  "Compare model routing strategies for an agentic workflow that mixes reasoning and tool use.",
];

export const DEFAULT_RULES = [
  {
    task_type: "debugging",
    primary_model: "kimi",
    fallback_model: "deepseek",
    strategy: "best_balance",
    confidence_threshold: 0.8,
    escalation_condition: "Escalate to DeepSeek when prompt mentions architecture, root cause, or incident.",
  },
  {
    task_type: "coding",
    primary_model: "kimi",
    fallback_model: "llama70b",
    strategy: "best_balance",
    confidence_threshold: 0.75,
    escalation_condition: "Use Llama for fast simple transformations.",
  },
  {
    task_type: "reasoning",
    primary_model: "deepseek",
    fallback_model: "kimi",
    strategy: "best_quality",
    confidence_threshold: 0.85,
    escalation_condition: "Use DeepSeek when accuracy matters more than latency.",
  },
  {
    task_type: "summarization",
    primary_model: "llama70b",
    fallback_model: "kimi",
    strategy: "lowest_cost",
    confidence_threshold: 0.7,
    escalation_condition: "Escalate to Kimi for long, technical inputs.",
  },
  {
    task_type: "structured_json",
    primary_model: "kimi",
    fallback_model: "llama70b",
    strategy: "best_structured",
    confidence_threshold: 0.9,
    escalation_condition: "If JSON invalid or quality < 4.0, escalate to fallback.",
  },
];
