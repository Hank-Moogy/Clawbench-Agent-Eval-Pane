export const MODELS = [
  { id: "kimi", name: "Kimi K2.5", positioning: "Strong general agent, great cost-quality balance" },
  { id: "deepseek", name: "DeepSeek R1", positioning: "Strong reasoning, slower but higher quality" },
  { id: "llama70b", name: "Llama 3.3 70B", positioning: "Fast general baseline, low cost" },
] as const;

// Widened to string so users can add arbitrary Nebius Token Factory model IDs at runtime.
export type ModelId = string;

// Curated catalog of Nebius Token Factory models. The `id` is the exact string
// the Agent Runner forwards to Nebius. Keep names short for chips.
export const NEBIUS_CATALOG: { id: string; name: string; family: string; tags?: string[] }[] = [
  // Meta Llama
  { id: "meta-llama/Meta-Llama-3.1-8B-Instruct", name: "Llama 3.1 8B Instruct", family: "Meta", tags: ["fast", "cheap"] },
  { id: "meta-llama/Meta-Llama-3.1-70B-Instruct", name: "Llama 3.1 70B Instruct", family: "Meta", tags: ["balanced"] },
  { id: "meta-llama/Meta-Llama-3.1-405B-Instruct", name: "Llama 3.1 405B Instruct", family: "Meta", tags: ["quality"] },
  { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B Instruct", family: "Meta", tags: ["balanced"] },
  { id: "meta-llama/Llama-3.2-1B-Instruct", name: "Llama 3.2 1B Instruct", family: "Meta", tags: ["fast", "cheap"] },
  { id: "meta-llama/Llama-3.2-3B-Instruct", name: "Llama 3.2 3B Instruct", family: "Meta", tags: ["fast", "cheap"] },
  // DeepSeek
  { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1", family: "DeepSeek", tags: ["reasoning"] },
  { id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B", name: "DeepSeek R1 Distill Llama 70B", family: "DeepSeek", tags: ["reasoning"] },
  { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3", family: "DeepSeek", tags: ["quality"] },
  { id: "deepseek-ai/DeepSeek-V3-0324", name: "DeepSeek V3 0324", family: "DeepSeek", tags: ["quality"] },
  // Qwen
  { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen 2.5 72B Instruct", family: "Qwen", tags: ["balanced"] },
  { id: "Qwen/Qwen2.5-32B-Instruct", name: "Qwen 2.5 32B Instruct", family: "Qwen" },
  { id: "Qwen/Qwen2.5-Coder-32B-Instruct", name: "Qwen 2.5 Coder 32B", family: "Qwen", tags: ["coding"] },
  { id: "Qwen/Qwen2.5-Coder-7B-Instruct", name: "Qwen 2.5 Coder 7B", family: "Qwen", tags: ["coding", "fast"] },
  { id: "Qwen/QwQ-32B", name: "QwQ 32B", family: "Qwen", tags: ["reasoning"] },
  { id: "Qwen/QwQ-32B-Preview", name: "QwQ 32B Preview", family: "Qwen", tags: ["reasoning"] },
  // Mistral
  { id: "mistralai/Mistral-Nemo-Instruct-2407", name: "Mistral Nemo Instruct", family: "Mistral", tags: ["balanced"] },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B Instruct", family: "Mistral" },
  { id: "mistralai/Mixtral-8x22B-Instruct-v0.1", name: "Mixtral 8x22B Instruct", family: "Mistral", tags: ["quality"] },
  // Moonshot / Kimi
  { id: "moonshotai/Kimi-K2-Instruct", name: "Kimi K2 Instruct", family: "Moonshot", tags: ["agent"] },
  // Microsoft
  { id: "microsoft/Phi-3.5-mini-instruct", name: "Phi 3.5 Mini Instruct", family: "Microsoft", tags: ["fast", "cheap"] },
  { id: "microsoft/Phi-3.5-MoE-instruct", name: "Phi 3.5 MoE Instruct", family: "Microsoft" },
  // NVIDIA
  { id: "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF", name: "Nemotron 70B", family: "NVIDIA", tags: ["quality"] },
  // Google
  { id: "google/gemma-2-9b-it", name: "Gemma 2 9B IT", family: "Google", tags: ["fast"] },
  { id: "google/gemma-2-27b-it", name: "Gemma 2 27B IT", family: "Google" },
  // Allen AI
  { id: "allenai/OLMo-2-1124-13B-Instruct", name: "OLMo 2 13B Instruct", family: "Allen AI" },
];


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
