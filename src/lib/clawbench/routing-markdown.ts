import { MODELS, NEBIUS_CATALOG, TASK_TYPES, STRATEGIES } from "./constants";

export type RoutingRule = {
  id: string;
  task_type: string;
  primary_model: string;
  fallback_model: string | null;
  strategy: string | null;
  confidence_threshold: number | null;
  escalation_condition: string | null;
  supporting_eval_count: number;
  updated_at: string;
};

// Deterministic tie-breaker order: when a message matches multiple task types,
// pick the FIRST one in this list that matched.
const TIE_BREAKER_ORDER = [
  "structured_json",
  "debugging",
  "coding",
  "reasoning",
  "summarization",
  "product_spec",
] as const;

type RubricEntry = {
  triggers: string[];
  shape: string;
  counter: string;
};

const RUBRIC: Record<string, RubricEntry> = {
  debugging: {
    triggers: [
      "the message contains an error string, stack trace, log line, or exit code",
      "phrases like \"doesn't work\", \"broken\", \"crash\", \"fails\", \"why is X failing\", \"500\", \"undefined\", \"null pointer\"",
      "the user pastes code AND asks what's wrong",
    ],
    shape: "Diagnose first, then fix. User wants a root cause + a concrete remediation.",
    counter: "If the user is asking to BUILD something new (no error mentioned), it's `coding`, not `debugging`.",
  },
  coding: {
    triggers: [
      "\"write\", \"implement\", \"add\", \"refactor\", \"convert\", \"port\", \"rename\", \"extract\"",
      "the user names a file, function, component, endpoint, or library to produce or modify",
      "the user pastes code and asks for a transformation (not a diagnosis)",
    ],
    shape: "Produce code. User wants a diff, a snippet, or a complete file.",
    counter: "If an error is the focus → `debugging`. If they want a written plan with no code → `product_spec`.",
  },
  reasoning: {
    triggers: [
      "\"compare\", \"trade-offs\", \"why\", \"which is better\", \"explain the difference\"",
      "open-ended analysis, architecture decisions, math/logic puzzles, multi-step inference",
      "no code expected; the deliverable is an argument or recommendation",
    ],
    shape: "Long-form reasoning, weighing options, citing constraints.",
    counter: "If the user wants a short factual summary of given text → `summarization`.",
  },
  summarization: {
    triggers: [
      "\"summarize\", \"tl;dr\", \"key points\", \"recap\", \"brief\"",
      "the user pastes a long document, transcript, log, or article and asks for a condensed version",
    ],
    shape: "Condense input into shorter output. Preserve facts, drop fluff.",
    counter: "If the user asks for analysis or recommendations on top of the summary → `reasoning`.",
  },
  structured_json: {
    triggers: [
      "the user explicitly asks for JSON, YAML, a schema, or shows a `{...}` example to fill",
      "phrases like \"return JSON\", \"as a JSON object\", \"strict schema\", \"valid JSON only\"",
      "the surrounding system asks for a machine-parseable response",
    ],
    shape: "Output ONLY the structured payload. No prose, no fences unless requested.",
    counter: "Always wins tie-breaks: if any structured-output signal is present, classify as `structured_json` regardless of topic.",
  },
  product_spec: {
    triggers: [
      "\"PRD\", \"spec\", \"requirements\", \"user stories\", \"acceptance criteria\", \"roadmap\"",
      "the user wants a written plan or design doc, not code",
    ],
    shape: "Structured prose: goals, scope, requirements, success criteria.",
    counter: "If the deliverable is code or a diff → `coding`.",
  },
};

const WORKED_EXAMPLES: { user: string; classify: string; why: string }[] = [
  {
    user: "TypeError: Cannot read properties of undefined (reading 'map') at line 42 — what's wrong?",
    classify: "debugging",
    why: "Stack-trace-like string + \"what's wrong\" = diagnose.",
  },
  {
    user: "Add a /healthz route to my Express app that returns { status: 'ok' }.",
    classify: "coding",
    why: "Verb \"add\" + names a route to produce.",
  },
  {
    user: "Compare Postgres row-level security vs application-level checks for a multi-tenant SaaS.",
    classify: "reasoning",
    why: "\"Compare\" + trade-off question, no code expected.",
  },
  {
    user: "Return JSON only: { \"steps\": [...], \"owner\": \"...\", \"status\": \"...\" } describing a release workflow.",
    classify: "structured_json",
    why: "Explicit JSON shape requested — wins over `product_spec` via tie-breaker.",
  },
  {
    user: "Summarize this 6k-word incident postmortem into 5 bullet points.",
    classify: "summarization",
    why: "\"Summarize\" + long pasted input + bullet-count target.",
  },
];

function modelDisplay(id: string | null | undefined): string {
  if (!id) return "—";
  const m =
    MODELS.find((x) => x.id === id) ??
    NEBIUS_CATALOG.find((x) => x.id === id);
  return m ? `${m.name} (\`${id}\`)` : `\`${id}\``;
}

function rawModelId(id: string | null | undefined): string {
  return id ?? "<no-fallback>";
}

function taskLabel(id: string): string {
  return TASK_TYPES.find((t) => t.id === id)?.label ?? id;
}

function strategyLabel(id: string | null): string {
  if (!id) return "—";
  return STRATEGIES.find((s) => s.id === id)?.label ?? id;
}

export function buildRoutingMarkdown(rules: RoutingRule[]): string {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  const ruleByType = new Map(rules.map((r) => [r.task_type, r]));
  const orderedTypes = TIE_BREAKER_ORDER.filter((t) => ruleByType.has(t));
  const defaultRule = ruleByType.get("coding") ?? rules[0];

  lines.push(
    `# Routing Rules — Agent Instructions`,
    ``,
    `> Generated by ClawBench on ${generatedAt}.`,
    ``,
  );

  // 1. Agent instructions
  lines.push(
    `## What this file is`,
    ``,
    `This file tells you (the coding agent reading it) **which underlying model to use for which kind of user request**, based on real evaluations run in ClawBench. It is the source of truth for model routing in this project. Treat it like a system instruction: consult it before answering.`,
    ``,
    `## What to do for every user request`,
    ``,
    `1. Read the **Classification rubric** below.`,
    `2. Pick **exactly one** task type for the user's latest message. If multiple match, use the **Tie-breaker priority** order.`,
    `3. Look up the matching row in the **Summary** table to find the recommended model.`,
    `4. Call that model via Nebius Token Factory. The user's API key is in the env var \`NEBIUS_API_KEY\` (see "How to call the model" at the bottom).`,
    `5. If the response fails the rule's **escalation condition** or its quality looks below the **confidence threshold**, retry once with the **fallback model**.`,
    `6. **If you can't programmatically switch models** (e.g. you're a fixed-model agent like Claude Code or Cursor's chat), still do this: prepend a single line to your reply — \`> Routing: \\\`<task_type>\\\` → recommended model \\\`<model_id>\\\` (per routing.md)\` — then answer with your current model, applying the rule's **strategy** as guidance for depth, tone, and structured-output strictness.`,
    ``,
    `**Tie-breaker priority** (highest first): ${TIE_BREAKER_ORDER.map((t) => `\`${t}\``).join(" > ")}.`,
    ``,
  );

  if (rules.length === 0) {
    lines.push(
      `_No routing rules defined yet. Run evals in ClawBench and save the winners as routing rules to populate this file._`,
      ``,
    );
    return lines.join("\n");
  }

  // 2. Summary table
  lines.push(
    `## Summary`,
    ``,
    `| Task type | Primary model | Fallback model | Strategy | Confidence threshold |`,
    `| --- | --- | --- | --- | --- |`,
  );
  for (const r of rules) {
    lines.push(
      `| \`${r.task_type}\` | ${modelDisplay(r.primary_model)} | ${modelDisplay(r.fallback_model)} | ${strategyLabel(r.strategy)} | ${r.confidence_threshold ?? "—"} |`,
    );
  }
  lines.push(``);

  // 3. Classification rubric
  lines.push(
    `## Classification rubric`,
    ``,
    `For each task type with a routing rule, here's how to detect it from the user's message.`,
    ``,
  );
  for (const t of orderedTypes) {
    const entry = RUBRIC[t];
    if (!entry) continue;
    lines.push(
      `### \`${t}\` — ${taskLabel(t)}`,
      ``,
      `**Triggers (pick this type if any apply):**`,
      ...entry.triggers.map((s) => `- ${s}`),
      ``,
      `**Shape of the deliverable:** ${entry.shape}`,
      ``,
      `**Don't pick this when:** ${entry.counter}`,
      ``,
    );
  }

  // 4. Worked examples
  lines.push(
    `## Worked examples`,
    ``,
    `| User message | Classify as | Why |`,
    `| --- | --- | --- |`,
  );
  for (const ex of WORKED_EXAMPLES) {
    if (!ruleByType.has(ex.classify)) continue;
    const rule = ruleByType.get(ex.classify)!;
    lines.push(
      `| ${ex.user.replace(/\|/g, "\\|")} | \`${ex.classify}\` → \`${rawModelId(rule.primary_model)}\` | ${ex.why} |`,
    );
  }
  lines.push(``);

  // 5. Per-rule detail
  lines.push(`## Rule details`, ``);
  for (const r of rules) {
    lines.push(
      `### \`${r.task_type}\` — ${taskLabel(r.task_type)}`,
      ``,
      `- **Primary model:** ${modelDisplay(r.primary_model)}`,
      `- **Fallback model:** ${modelDisplay(r.fallback_model)}`,
      `- **Strategy:** ${strategyLabel(r.strategy)}`,
      `- **Confidence threshold:** ${r.confidence_threshold ?? "—"}`,
      `- **Escalation condition:** ${r.escalation_condition?.trim() ? r.escalation_condition.trim() : "_none_"}`,
      `- **Supporting evals:** ${r.supporting_eval_count}`,
      ``,
    );
  }

  // 6. Decision algorithm
  lines.push(
    `## Decision algorithm (pseudocode)`,
    ``,
    "```text",
    `function route(userMessage):`,
    `  taskType = classify(userMessage)            // see Classification rubric`,
    `  rule     = rules[taskType] or rules["${defaultRule?.task_type ?? "coding"}"]`,
    `  response = call(rule.primary_model, userMessage)`,
    `  if response.confidence < rule.confidence_threshold`,
    `     or matches(response, rule.escalation_condition):`,
    `    response = call(rule.fallback_model, userMessage)`,
    `  return response`,
    "```",
    ``,
  );

  // 7. How to call the model
  lines.push(
    `## How to call the model`,
    ``,
    `All models in this file are served by Nebius Token Factory. The API is OpenAI-compatible.`,
    ``,
    "```bash",
    `curl https://api.studio.nebius.com/v1/chat/completions \\`,
    `  -H "Authorization: Bearer $NEBIUS_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{`,
    `    "model": "<model_id from the table above>",`,
    `    "messages": [{ "role": "user", "content": "<the user message>" }]`,
    `  }'`,
    "```",
    ``,
    `The \`NEBIUS_API_KEY\` env var is set up via the ClawBench onboarding snippet. Get a key at https://studio.nebius.com.`,
    ``,
    `_Generated by [ClawBench](https://ai-agent-balancer.lovable.app) — agent eval control plane._`,
    ``,
  );

  return lines.join("\n");
}
