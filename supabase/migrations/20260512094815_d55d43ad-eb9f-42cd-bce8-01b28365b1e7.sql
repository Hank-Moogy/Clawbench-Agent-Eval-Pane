-- Set user_id default to auth.uid() so inserts auto-tag the owner
ALTER TABLE public.app_settings    ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.dataset_exports ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.eval_tasks      ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.eval_runs       ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.routing_rules   ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop the permissive policies
DROP POLICY IF EXISTS "public all app_settings"    ON public.app_settings;
DROP POLICY IF EXISTS "public all dataset_exports" ON public.dataset_exports;
DROP POLICY IF EXISTS "public all eval_tasks"      ON public.eval_tasks;
DROP POLICY IF EXISTS "public all eval_runs"       ON public.eval_runs;
DROP POLICY IF EXISTS "public all routing_rules"   ON public.routing_rules;

-- app_settings: owner-only
CREATE POLICY "own app_settings select" ON public.app_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own app_settings insert" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own app_settings update" ON public.app_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own app_settings delete" ON public.app_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- dataset_exports: owner-only
CREATE POLICY "own dataset_exports select" ON public.dataset_exports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own dataset_exports insert" ON public.dataset_exports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own dataset_exports update" ON public.dataset_exports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own dataset_exports delete" ON public.dataset_exports FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- eval_tasks: owner-only
CREATE POLICY "own eval_tasks select" ON public.eval_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own eval_tasks insert" ON public.eval_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own eval_tasks update" ON public.eval_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own eval_tasks delete" ON public.eval_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- eval_runs: owner-only
CREATE POLICY "own eval_runs select" ON public.eval_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own eval_runs insert" ON public.eval_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own eval_runs update" ON public.eval_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own eval_runs delete" ON public.eval_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- routing_rules: owner-only
CREATE POLICY "own routing_rules select" ON public.routing_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own routing_rules insert" ON public.routing_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own routing_rules update" ON public.routing_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own routing_rules delete" ON public.routing_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);