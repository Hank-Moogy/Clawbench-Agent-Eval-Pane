ALTER TABLE public.app_settings ALTER COLUMN api_mode SET DEFAULT 'real';
UPDATE public.app_settings SET api_mode = 'real' WHERE api_mode = 'mock';