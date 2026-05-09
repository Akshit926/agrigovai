ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER TABLE public.grievances REPLICA IDENTITY FULL;
ALTER TABLE public.schemes REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.applications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.grievances; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.schemes; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;