
CREATE POLICY "Authenticated can read generated posters"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'generated-posters');

CREATE POLICY "Users can upload own posters"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'generated-posters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own posters"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'generated-posters' AND (storage.foldername(name))[1] = auth.uid()::text);
