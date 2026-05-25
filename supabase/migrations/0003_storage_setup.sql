-- ============================================================================
-- Migration: 0003_storage_setup
-- Projeto: CRM Leandro Alonso
-- ============================================================================
-- Este arquivo cria os buckets do Supabase Storage e suas políticas.
--
-- Buckets criados:
-- - properties: fotos de imóveis (público para leitura, apenas logados gravam)
-- - avatars: fotos de perfil (público para leitura, cada usuário grava o seu)
-- - logos: logos do workspace (público para leitura, admin grava)
-- ============================================================================


-- ============================================================================
-- CRIAR BUCKETS
-- ============================================================================

-- Bucket: properties (fotos de imóveis)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'properties',
  'properties',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- POLICIES: bucket 'properties'
-- ============================================================================

-- Leitura pública (qualquer um pode ver fotos de imóveis)
CREATE POLICY "properties_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'properties');

-- Autenticados podem fazer upload no próprio workspace
-- A convenção de path é: {workspace_id}/{property_id}/{filename}
CREATE POLICY "properties_storage_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'properties'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
  );

-- Autenticados podem atualizar arquivos do próprio workspace
CREATE POLICY "properties_storage_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'properties'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
  );

-- Autenticados podem deletar arquivos do próprio workspace
CREATE POLICY "properties_storage_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'properties'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
  );


-- ============================================================================
-- POLICIES: bucket 'avatars'
-- ============================================================================

CREATE POLICY "avatars_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Cada usuário gerencia o próprio avatar
-- Convenção de path: {user_id}/avatar.{ext}
CREATE POLICY "avatars_storage_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_storage_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_storage_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================================
-- POLICIES: bucket 'logos'
-- ============================================================================

CREATE POLICY "logos_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

-- Apenas admin do workspace pode gerenciar logos
-- Convenção de path: {workspace_id}/logo.{ext}
CREATE POLICY "logos_storage_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "logos_storage_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "logos_storage_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
