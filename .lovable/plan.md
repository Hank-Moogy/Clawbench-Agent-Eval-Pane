# ClawBench — Mocked Inference, Real App Backend

Only OpenClaw/Nebius model execution is mocked. Everything else (persistence, history, rules, leaderboard, observability, exports, settings) is real, backed by Lovable Cloud (Supabase). The app should feel like a working product, not a static mockup.

## Backend: Lovable Cloud schema

Enable Lovable Cloud and create migrations for:

- `eval_tasks` — id, prompt, task_type, strategy, selected_models (jsonb), require_json, timeout_seconds, max_tokens, mode, created_at
- `eval_runs` — id, task_id (fk → eval_tasks on delete cascade), model_id, model_display_name, output, quality_score, correctness, completeness, actionability, format_reliability, agent_utility, efficiency_score, latency_ms, input_tokens, output_tokens, total_tokens, estimated_cost, cost_per_quality_point, reliability_status, json_valid, is_winner, judge_explanation, recommendation_reason, status, created_at
- `routing_rules` — id, task_type, primary_model, fallback_model, strategy, confidence_threshold, escalation_condition, supporting_eval_count, created_at, updated_at
- `dataset_exports` — id, name, format, selected_run_ids (jsonb), jsonl_preview, example_count, avg_quality_score, created_at
- `app_settings` — id, api_mode, agent_runner_api_url, model_display_names (jsonb), created_at, updated_at

No-auth prototype: include a nullable `user_id uuid` column on each table for future use, and use permissive RLS (public read/write) for now so the demo works without login. Schema is forward-compatible with auth.

Seed on first load (handled by the mock API layer when tables are empty): 12 realistic `eval_tasks` + matching `eval_runs` across all 6 task types with realistic per-model distributions (Kimi 4.1–4.8 / 7–11s / $0.0025–0.0045 / 90% JSON; DeepSeek 4.4–4.9 / 12–22s / $0.005–0.010 / 85%; Llama 3.5–4.3 / 4–8s / $0.0015–0.003 / 80%), a few failed/timeout runs, and the 5 default routing rules.

## API abstraction (`src/lib/api/clawbench.ts`)

Single typed module the UI calls. Branches on `api_mode` from `app_settings`:

- `runEval(payload)`
  - mock: generate per-model outputs + metrics locally, compute winner per strategy, insert one `eval_tasks` row + N `eval_runs` rows, mark winner with `is_winner=true`, return `{ taskId, runs }`.
  - real: `POST ${agent_runner_api_url}/run-eval` expecting the same shape, then persist results identically.
- `getEvalHistory(filters)`, `getEvalById(id)`, `getRunsForTask(id)`
- `getLeaderboard()` — aggregates from `eval_runs` grouped by model + task_type (eval_count, win_rate, avg quality/correctness/actionability/format_reliability/latency/cost/efficiency, json_validity_rate, failure_rate).
- `getObservability()` — totals, averages, runs-over-time, task distribution, per-model latency/cost/quality, scatter data.
- `getRoutingRules()`, `saveRoutingRule(rule)` (insert/update), `deleteRoutingRule(id)`, `getSupportingEvals(task_type, model)`
- `exportDataset({ runIds, format, name })` — fetches selected winning runs + their tasks, builds JSONL chat-format text, inserts a `dataset_exports` row, returns `{ jsonl, exportId }`.
- `getSettings()`, `saveSettings(patch)`, `testConnection(url)` — mock returns OK, real does `GET ${url}/health`.

All aggregations done in SQL (RPC or views) where possible; client-side fallback for chart shaping. No static mock arrays read by UI components — every screen reads from Cloud.

## Mock inference generator

Pure function `generateMockRun(model, task_type, strategy, prompt)` returning realistic output text + metrics within the per-model ranges above. Winner picker per strategy:
- best quality → max quality_score
- lowest latency → min latency_ms (completed only)
- lowest cost → min estimated_cost (completed only)
- best balance → max efficiency_score = `quality / (cost*1000 + latency_s*0.05)` scaled 0–100
- best structured → max format_reliability among json_valid runs

Generates judge_explanation + recommendation_reason strings tailored to the winner.

## localStorage usage (limited)

Only for ephemeral UI: sidebar collapsed, theme, current draft prompt. Never for eval data, rules, exports, or settings.

## UI screens (unchanged from prior plan, now backed by Cloud)

1. **Run Eval** — prompt, task type, strategy, model multi-select, advanced accordion. On submit: 2–4s simulated progress UI, calls `runEval`, navigates to `/eval/$taskId` on success.
2. **Eval Result Detail** (`/eval/$taskId`) — loads task + runs from DB. Winner card, per-model comparison cards, full metrics table with actions, tabbed output panels (Mark preferred / Flag), radar+bar score breakdown with judge explanation, routing recommendation card with Save Routing Rule (writes to DB), Export Winning Run, Re-run, Back.
3. **Eval History** — server-side filtered list from `eval_tasks` joined with winning `eval_runs`. Actions: view, re-run (clones task), export winning, create rule. Empty state.
4. **Leaderboard** — top metric cards + grouped table + 4 charts, all from real aggregations.
5. **Routing Rules** — full CRUD against `routing_rules`. Edit/create modal. "View supporting evals" deep-links to History filtered by task_type + model. "Test rule" runs a quick mocked dry-run.
6. **Observability** — 10 KPI cards + 8 charts computed from `eval_runs`. Insights panel renders narrative bullets derived from the actual aggregates (not hardcoded).
7. **Dataset Export** — filterable table of winning runs. Format selector (JSONL chat / CSV / Raw JSON). Live preview built from selection. Buttons: Export selected (writes `dataset_exports` row), Copy JSONL, Download `.jsonl` via Blob, Mark training-ready. Dataset metrics summary.
8. **Settings** — reads/writes `app_settings`. API mode toggle (Mock/Real), Agent Runner URL with Save + Test connection (with status display), connection status card with last test timestamp, security notes panel, editable model display names that propagate everywhere via the `model_display_names` map.

## Tech notes

- TanStack Start file routes; sidebar layout in `__root.tsx` via shadcn `Sidebar` (collapsible, current-route highlighting).
- TanStack Query for all DB reads with sensible invalidation on writes.
- Recharts for charts; shadcn primitives for UI.
- Aggregations via Postgres views/RPCs created in the migration where it simplifies the leaderboard/observability queries.
- Switching `api_mode` to `real` later requires zero UI changes — only the `runEval` branch hits the Cloudflare Tunnel endpoint.
