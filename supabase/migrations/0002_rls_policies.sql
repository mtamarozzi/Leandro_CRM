-- ============================================================================
-- Migration: 0002_rls_policies
-- Projeto: CRM Leandro Alonso
-- ============================================================================
-- Este arquivo ativa Row Level Security (RLS) em todas as tabelas
-- e define as políticas de acesso.
--
-- Princípio geral:
-- - Usuários autenticados só veem dados do PRÓPRIO workspace
-- - Alguns dados (imóveis públicos) podem ser lidos por visitantes anônimos
-- - O chat widget (visitantes anônimos) precisa de policies específicas
--   para criar conversas e mensagens sem login
-- ============================================================================


-- ============================================================================
-- HELPER: função para obter o workspace_id do usuário logado
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- ATIVAR RLS EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.workspaces            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_properties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages         ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- POLICIES: workspaces
-- ============================================================================
-- Usuário vê apenas o próprio workspace
CREATE POLICY "workspaces_select_own"
  ON public.workspaces FOR SELECT
  USING (id = public.current_workspace_id());

-- Só admin pode atualizar o próprio workspace
CREATE POLICY "workspaces_update_own"
  ON public.workspaces FOR UPDATE
  USING (
    id = public.current_workspace_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================================
-- POLICIES: profiles
-- ============================================================================
CREATE POLICY "profiles_select_same_workspace"
  ON public.profiles FOR SELECT
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());


-- ============================================================================
-- POLICIES: properties
-- ============================================================================
-- Autenticado: CRUD completo nos imóveis do próprio workspace
CREATE POLICY "properties_select_own_workspace"
  ON public.properties FOR SELECT
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "properties_insert_own_workspace"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY "properties_update_own_workspace"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "properties_delete_own_workspace"
  ON public.properties FOR DELETE
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

-- Anônimo (site público): pode LER imóveis públicos e disponíveis
CREATE POLICY "properties_select_public_anon"
  ON public.properties FOR SELECT
  TO anon
  USING (
    is_public = true
    AND deleted_at IS NULL
    AND status IN ('disponivel', 'reservado')
  );


-- ============================================================================
-- POLICIES: media
-- ============================================================================
CREATE POLICY "media_select_own_workspace"
  ON public.media FOR SELECT
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "media_insert_own_workspace"
  ON public.media FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY "media_update_own_workspace"
  ON public.media FOR UPDATE
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "media_delete_own_workspace"
  ON public.media FOR DELETE
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

-- Anônimo pode ver mídia de imóveis públicos
CREATE POLICY "media_select_public_anon"
  ON public.media FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = media.property_id
        AND p.is_public = true
        AND p.deleted_at IS NULL
        AND p.status IN ('disponivel', 'reservado')
    )
  );


-- ============================================================================
-- POLICIES: leads
-- ============================================================================
CREATE POLICY "leads_select_own_workspace"
  ON public.leads FOR SELECT
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "leads_insert_own_workspace"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY "leads_update_own_workspace"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "leads_delete_own_workspace"
  ON public.leads FOR DELETE
  TO authenticated
  USING (workspace_id = public.current_workspace_id());


-- ============================================================================
-- POLICIES: lead_properties
-- ============================================================================
CREATE POLICY "lead_properties_all_own_workspace"
  ON public.lead_properties FOR ALL
  TO authenticated
  USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());


-- ============================================================================
-- POLICIES: interactions
-- ============================================================================
CREATE POLICY "interactions_select_own_workspace"
  ON public.interactions FOR SELECT
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "interactions_insert_own_workspace"
  ON public.interactions FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());


-- ============================================================================
-- POLICIES: events
-- ============================================================================
CREATE POLICY "events_select_own_workspace"
  ON public.events FOR SELECT
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "events_insert_own_workspace"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY "events_update_own_workspace"
  ON public.events FOR UPDATE
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "events_delete_own_workspace"
  ON public.events FOR DELETE
  TO authenticated
  USING (workspace_id = public.current_workspace_id());


-- ============================================================================
-- POLICIES: notifications
-- ============================================================================
-- Usuário só vê as próprias notificações
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ============================================================================
-- POLICIES: chat_conversations (atenção: permite anônimo)
-- ============================================================================
-- Usuário autenticado: vê conversas do próprio workspace
CREATE POLICY "chat_conversations_select_own_workspace"
  ON public.chat_conversations FOR SELECT
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "chat_conversations_update_own_workspace"
  ON public.chat_conversations FOR UPDATE
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

-- Anônimo (visitante no chat widget): pode CRIAR conversa nova
-- Pode ler apenas a própria conversa (buscar por visitor_id)
CREATE POLICY "chat_conversations_insert_anon"
  ON public.chat_conversations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "chat_conversations_select_anon_by_visitor"
  ON public.chat_conversations FOR SELECT
  TO anon
  USING (true);  -- o filtro por visitor_id é feito no client


-- ============================================================================
-- POLICIES: chat_messages (atenção: permite anônimo)
-- ============================================================================
CREATE POLICY "chat_messages_select_own_workspace"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (workspace_id = public.current_workspace_id());

-- Anônimo pode inserir mensagem (visitante falando)
CREATE POLICY "chat_messages_insert_anon"
  ON public.chat_messages FOR INSERT
  TO anon
  WITH CHECK (sender_type = 'visitor');

-- Anônimo pode ler mensagens (pra aparecerem no widget)
CREATE POLICY "chat_messages_select_anon"
  ON public.chat_messages FOR SELECT
  TO anon
  USING (true);


-- ============================================================================
-- OBSERVAÇÕES IMPORTANTES
-- ============================================================================
-- 1. As policies acima são PERMISSIVAS no lado anônimo para o chat widget
--    funcionar sem login. Na Fase B vamos restringir mais usando validação
--    de visitor_id assinado.
--
-- 2. O service_role key (usado pelo n8n) IGNORA todas essas policies.
--    Por isso ele deve ser guardado com cuidado e nunca exposto no frontend.
--
-- 3. Todas as queries autenticadas usam current_workspace_id() para filtrar.
--    Isso garante isolamento perfeito entre workspaces quando virarmos SaaS.
-- ============================================================================
