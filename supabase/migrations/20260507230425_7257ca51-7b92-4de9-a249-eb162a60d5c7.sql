
create table public.eval_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  prompt text not null,
  task_type text not null,
  strategy text not null,
  selected_models jsonb not null default '[]'::jsonb,
  require_json boolean not null default false,
  timeout_seconds integer,
  max_tokens integer,
  mode text not null default 'mock',
  created_at timestamptz not null default now()
);

create table public.eval_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.eval_tasks(id) on delete cascade,
  user_id uuid,
  model_id text not null,
  model_display_name text,
  output text,
  quality_score numeric,
  correctness numeric,
  completeness numeric,
  actionability numeric,
  format_reliability numeric,
  agent_utility numeric,
  efficiency_score numeric,
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost numeric,
  cost_per_quality_point numeric,
  reliability_status text,
  json_valid boolean,
  is_winner boolean not null default false,
  judge_explanation text,
  recommendation_reason text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
create index eval_runs_task_id_idx on public.eval_runs(task_id);
create index eval_runs_model_id_idx on public.eval_runs(model_id);

create table public.routing_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  task_type text not null,
  primary_model text not null,
  fallback_model text,
  strategy text,
  confidence_threshold numeric,
  escalation_condition text,
  supporting_eval_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dataset_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  format text not null,
  selected_run_ids jsonb not null default '[]'::jsonb,
  jsonl_preview text,
  example_count integer,
  avg_quality_score numeric,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  api_mode text not null default 'mock',
  agent_runner_api_url text,
  model_display_names jsonb not null default '{"kimi":"Kimi K2.5","deepseek":"DeepSeek R1","llama70b":"Llama 3.3 70B"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.eval_tasks enable row level security;
alter table public.eval_runs enable row level security;
alter table public.routing_rules enable row level security;
alter table public.dataset_exports enable row level security;
alter table public.app_settings enable row level security;

-- Permissive prototype policies (no auth yet). Schema is forward-compatible with user_id.
create policy "public all eval_tasks" on public.eval_tasks for all using (true) with check (true);
create policy "public all eval_runs" on public.eval_runs for all using (true) with check (true);
create policy "public all routing_rules" on public.routing_rules for all using (true) with check (true);
create policy "public all dataset_exports" on public.dataset_exports for all using (true) with check (true);
create policy "public all app_settings" on public.app_settings for all using (true) with check (true);
