-- ============================================================
-- Buat bucket `soal-images` untuk gambar soal MUSSE
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Buat bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('soal-images', 'soal-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: siapa pun bisa baca (public read)
DROP POLICY IF EXISTS "Public read soal-images" ON storage.objects;
CREATE POLICY "Public read soal-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'soal-images');

-- 3. Policy: hanya service_role yang bisa upload/update/delete
-- (anon TIDAK bisa upload — aman dari spam)
DROP POLICY IF EXISTS "Service upload soal-images" ON storage.objects;
CREATE POLICY "Service upload soal-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'soal-images');

DROP POLICY IF EXISTS "Service update soal-images" ON storage.objects;
CREATE POLICY "Service update soal-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'soal-images');

DROP POLICY IF EXISTS "Service delete soal-images" ON storage.objects;
CREATE POLICY "Service delete soal-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'soal-images');

-- 4. Verifikasi
SELECT id, name, public FROM storage.buckets WHERE id = 'soal-images';
