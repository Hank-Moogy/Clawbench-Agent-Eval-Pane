## Goal

Rewrite the generated `routing.md` so that any coding agent (Cursor, Claude Code, Lovable, custom) reading it has a deterministic recipe to:
1. Know **what this file is** and **when to consult it**.
2. **Classify** the incoming user request into one of our task types using concrete signals — not vibes.
3. Pick the right model and call it through the user's Nebius setup.
4. Handle the fallback / escalation path.

No new tables, no new routes, no router runtime — this is a pure upgrade to the markdown generator.

## What changes

**Single file edited:** `src/lib/clawbench/routing-markdown.ts`

The new `buildRoutingMarkdown(rules)` output gains four new sections, in this order:

1. **Agent instructions (top of file, above everything)**
   - One-paragraph "what this file is" framing.
   - A numbered "Before answering any user request, do the following" checklist the agent can literally follow:
     1. Read the classification rubric below.
     2. Pick exactly one task type for the user's latest message.
     3. Look up the rule in the Summary table.
     4. Use the listed primary model (call via Nebius using the env key `NEBIUS_API_KEY`).
     5. If you can't or won't switch models (e.g. you're locked to one model), still apply the **strategy** and **escalation condition** as guidance for tone, depth, and structured-output strictness.
   - Note: "If your runtime cannot programmatically switch models, surface the recommended model to the user as a one-line suggestion at the top of your reply, then proceed."

2. **Classification rubric** (the core of option 1)
   For each task type, list:
   - **Triggers** — concrete keywords / patterns in the user message (e.g. debugging: "error", "stack trace", "crash", "doesn't work", pasted log lines, "why is X failing").
   - **Shape** — what the user's message looks like (e.g. structured_json: "the user explicitly asks for JSON / a schema / `{...}` example").
   - **Counter-signals** — when NOT to pick this type.
   - **Tie-breakers** — ordered priority list when two types match (e.g. `structured_json` > `debugging` > `coding` > `reasoning` > `summarization` > `product_spec`), so classification is deterministic.

   The rubric is generated only for task types that actually have a rule, but the tie-breaker priority is always emitted in full.

3. **Worked examples**
   3–5 short "user said X → classify as Y → use model Z" examples drawn from `EXAMPLE_PROMPTS` plus a couple of new ones, so the agent has few-shot anchors.

4. **Existing sections** (Summary table, Per-rule detail, Decision algorithm) stay, but:
   - The decision-algorithm pseudocode is updated to call `classify(prompt)` first.
   - A short "How to call the model" snippet is appended showing the exact Nebius `chat/completions` curl/JSON shape, with `${NEBIUS_API_KEY}` as the secret reference. This makes the file self-contained for any agent.

## Out of scope (intentionally)

- No router runtime (`router.ts`), no MCP server, no edge function.
- No changes to the rules schema, the dialog, or the landing page (the dialog already shows whatever markdown we generate).
- No changes to the Nebius onboarding snippet — but the new "How to call the model" block in `routing.md` will mirror the same env var name (`NEBIUS_API_KEY`) so the two stay consistent.

## Technical notes

- Rubric content is hardcoded in `routing-markdown.ts` keyed by `task_type` id, so adding a new task type later requires editing this file (acceptable — task types are a fixed enum in `constants.ts`).
- Tie-breaker order is a single constant array at the top of the generator.
- All existing call sites (`routing-md-dialog.tsx`, landing page preview) keep working since the function signature is unchanged.
- The generated file stays plain markdown — no frontmatter, no JSON blocks the agent might mis-parse.

## Acceptance check

After implementation, the exported `routing.md` should, on its own (no other context), let a fresh agent answer "given this user message, which model should I call and how?" without guessing. We'll eyeball the rendered output in the existing Export dialog on `/rules`.
