-- Remove duplicate admin: admin@agrigov.ai
DELETE FROM public.user_roles WHERE user_id = 'ad196db2-cfda-4953-b249-af838c3c4851';
DELETE FROM auth.users WHERE id = 'ad196db2-cfda-4953-b249-af838c3c4851';

-- Add document URLs column to applications for real file uploads
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS document_urls jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Storage bucket for farmer documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('farmer-documents', 'farmer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: farmers manage their own folder; admins read all
CREATE POLICY "Farmers upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'farmer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Farmers view own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'farmer-documents'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Farmers update own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'farmer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Farmers delete own documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'farmer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);