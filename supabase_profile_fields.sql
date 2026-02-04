-- Añadir campos adicionales al perfil de usuario

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Lima';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;  -- Foto subida por el usuario (diferente a Google)

-- Crear bucket para avatares si no existe (ejecutar en Supabase Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Policy para que usuarios puedan subir su avatar
-- CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT
-- USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can update their avatars" ON storage.objects FOR UPDATE
-- USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their avatars" ON storage.objects FOR DELETE
-- USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
