-- Crear bucket para avatares
-- NOTA: Ejecutar en Supabase Dashboard > Storage > New bucket
-- O usar este SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 
    'avatars', 
    true,  -- público para que se puedan ver los avatares
    2097152,  -- 2MB max
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket avatars

-- Usuarios pueden subir su propia foto (en carpeta con su user_id)
CREATE POLICY "Users can upload own avatar" ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Cualquiera puede ver los avatares (son públicos)
CREATE POLICY "Anyone can view avatars" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Usuarios pueden actualizar su propia foto
CREATE POLICY "Users can update own avatar" ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden eliminar su propia foto
CREATE POLICY "Users can delete own avatar" ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
