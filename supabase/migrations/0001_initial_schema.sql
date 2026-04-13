-- ============================================================================
-- Migration: 0001_initial_schema
-- Projeto: CRM Leandro Alonso
-- Criado em: 2026-04-13
-- ============================================================================
-- Este arquivo cria toda a estrutura inicial do banco de dados:
-- - Tipos ENUM
-- - Tabelas principais
-- - Índices
-- - Triggers automáticos
--
-- As políticas de Row Level Security (RLS) e os Storage buckets estão
-- em arquivos separados (0002_rls_policies.sql e 0003_storage_setup.sql)
-- para facilitar a manutenção.
--
-- Convenções adotadas:
-- - Nomes em inglês, snake_case
-- - IDs são UUIDs com default gen_random_uuid()
-- - Toda tabela tem created_at, updated_at
-- - Soft delete onde aplicável (deleted_at)
-- - Foreign keys com ON DELETE CASCADE ou SET NULL explícitos
-- - Todas as tabelas têm workspace_id (preparação para Fase B multi-tenant)
-- ============================================================================


-- ============================================================================
-- 1. EXTENSÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 2. TIPOS ENUM
-- ============================================================================

-- Status possíveis de um lead no funil de vendas
CREATE TYPE lead_status AS ENUM (
  'novo',
  'contato',
  'visita',
  'proposta',
  'ganho',
  'perdido'
);

-- Origem de captação do lead
CREATE TYPE lead_origin AS ENUM (
  'chat_widget',
  'whatsapp',
  'facebook',
  'instagram',
  'google',
  'indicacao',
  'site',
  'trafego_pago',
  'manual',
  'outro'
);

-- Finalidade do imóvel (unifica venda, locação e lançamento em uma tabela)
CREATE TYPE property_purpose AS ENUM (
  'venda',
  'locacao',
  'lancamento'
);

-- Tipo do imóvel
CREATE TYPE property_kind AS ENUM (
  'apartamento',
  'casa',
  'cobertura',
  'studio',
  'sobrado',
  'terreno',
  'comercial',
  'sala_comercial',
  'galpao',
  'chacara',
  'outro'
);

-- Status de disponibilidade do imóvel
CREATE TYPE property_status AS ENUM (
  'disponivel',
  'reservado',
  'alugado',
  'vendido',
  'indisponivel'
);

-- Tipo de evento na agenda
CREATE TYPE event_type AS ENUM (
  'followup',
  'visita',
  'reuniao',
  'tarefa',
  'ligacao'
);

-- Status do evento
CREATE TYPE event_status AS ENUM (
  'agendado',
  'confirmado',
  'realizado',
  'cancelado',
  'nao_compareceu'
);

-- Tipo de interação registrada no histórico do lead
CREATE TYPE interaction_type AS ENUM (
  'whatsapp',
  'call',
  'email',
  'visit',
  'meeting',
  'note',
  'status_change',
  'ai_action'
);

-- Tipo de notificação
CREATE TYPE notification_type AS ENUM (
  'new_lead',
  'event_reminder',
  'lead_assigned',
  'ai_insight',
  'ai_handoff',
  'system'
);

-- Status de uma conversa no chat (widget ou WhatsApp)
CREATE TYPE conversation_status AS ENUM (
  'ai_mode',
  'human_mode',
  'archived',
  'resolved'
);

-- Tipo de quem enviou a mensagem
CREATE TYPE chat_sender_type AS ENUM (
  'visitor',
  'ai',
  'human',
  'system'
);


-- ============================================================================
-- 3. FUNÇÃO HELPER: updated_at automático
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 4. TABELA: workspaces
-- ============================================================================
-- Na Fase A, só vai existir 1 workspace (o do Leandro).
-- Na Fase B (SaaS multi-tenant), cada imobiliária terá o seu.
-- Ter a tabela desde o início facilita muito a migração futura.
-- ============================================================================
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  creci TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#D4A017',
  plan TEXT NOT NULL DEFAULT 'free',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 5. TABELA: profiles (estende auth.users)
-- ============================================================================
-- Supabase Auth gerencia auth.users. A tabela profiles adiciona campos
-- específicos do nosso app (nome, avatar, role, workspace).
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'corretor',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profiles_workspace_id_idx ON public.profiles(workspace_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 6. TABELA: properties
-- ============================================================================
-- Unifica venda, locação e lançamento em uma única tabela.
-- O discriminador é o campo 'purpose'.
--
-- - purpose = 'venda'      -> imóveis de venda normal
-- - purpose = 'locacao'    -> imóveis para alugar
-- - purpose = 'lancamento' -> venda com development_name e developer preenchidos
--
-- Campos que só fazem sentido em alguns tipos (ex: rent_price para locação)
-- ficam como NULL quando não aplicáveis.
-- ============================================================================
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Código de referência (equivalente ao "ALG-SP-001" da planilha do Leandro)
  ref_code TEXT,

  -- Classificação
  purpose property_purpose NOT NULL,
  kind property_kind NOT NULL DEFAULT 'apartamento',
  status property_status NOT NULL DEFAULT 'disponivel',

  -- Empreendimento (apenas quando purpose = 'lancamento')
  development_name TEXT,
  developer TEXT,

  -- Localização
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  full_address TEXT,
  floor TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  -- Características físicas
  usable_area_m2 NUMERIC(8, 2),
  bedrooms INTEGER DEFAULT 0,
  suites INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  parking_spots INTEGER DEFAULT 0,
  garage_type TEXT,
  is_furnished BOOLEAN DEFAULT false,
  has_balcony BOOLEAN DEFAULT false,
  pet_friendly BOOLEAN DEFAULT false,

  -- Valores
  sale_price NUMERIC(12, 2),
  rent_price NUMERIC(10, 2),
  condo_fee NUMERIC(10, 2),
  iptu NUMERIC(10, 2),
  total_monthly NUMERIC(10, 2),

  -- Exclusivos de locação
  guarantee_type TEXT,
  contract_type TEXT,
  min_contract TEXT,
  availability TEXT DEFAULT 'Imediata',

  -- Exclusivos de venda
  payment_conditions TEXT,

  -- Descrições
  highlights TEXT,
  public_description TEXT,

  -- Flags
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT properties_ref_code_workspace_unique UNIQUE (workspace_id, ref_code)
);

CREATE INDEX properties_workspace_idx ON public.properties(workspace_id);
CREATE INDEX properties_purpose_status_idx ON public.properties(purpose, status);
CREATE INDEX properties_city_neighborhood_idx ON public.properties(city, neighborhood);
CREATE INDEX properties_sale_price_idx ON public.properties(sale_price)
  WHERE sale_price IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX properties_rent_price_idx ON public.properties(rent_price)
  WHERE rent_price IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX properties_public_idx ON public.properties(workspace_id, is_public, status)
  WHERE deleted_at IS NULL;

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 7. TABELA: media (fotos dos imóveis)
-- ============================================================================
-- Cada imóvel pode ter várias fotos no Supabase Storage.
-- A tabela media guarda metadados (URL, ordem, legenda).
-- ============================================================================
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX media_property_id_idx ON public.media(property_id);
CREATE INDEX media_workspace_idx ON public.media(workspace_id);


-- ============================================================================
-- 8. TABELA: leads
-- ============================================================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Dados básicos
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,

  -- Pipeline
  status lead_status NOT NULL DEFAULT 'novo',
  origin lead_origin NOT NULL DEFAULT 'manual',

  -- Interesse declarado
  interest_type TEXT,
  interest_purpose property_purpose,
  budget_min NUMERIC(12, 2),
  budget_max NUMERIC(12, 2),
  preferred_region TEXT,
  preferred_city TEXT,

  -- Notas manuais do corretor
  notes TEXT,

  -- Análise da IA (preenchida pela Dorinda)
  ai_score INTEGER CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100)),
  ai_summary TEXT,
  ai_next_action TEXT,
  ai_analyzed_at TIMESTAMPTZ,

  -- Auditoria
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX leads_workspace_idx ON public.leads(workspace_id);
CREATE INDEX leads_status_idx ON public.leads(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX leads_phone_idx ON public.leads(workspace_id, phone);
CREATE INDEX leads_assigned_to_idx ON public.leads(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX leads_created_at_idx ON public.leads(workspace_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 9. TABELA: lead_properties (N:M entre leads e propriedades)
-- ============================================================================
CREATE TABLE public.lead_properties (
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  interest_level INTEGER DEFAULT 1 CHECK (interest_level BETWEEN 1 AND 5),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, property_id)
);

CREATE INDEX lead_properties_property_idx ON public.lead_properties(property_id);
CREATE INDEX lead_properties_workspace_idx ON public.lead_properties(workspace_id);


-- ============================================================================
-- 10. TABELA: interactions (histórico de cada lead)
-- ============================================================================
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  type interaction_type NOT NULL,
  content TEXT,
  metadata JSONB,

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX interactions_lead_idx ON public.interactions(lead_id, occurred_at DESC);
CREATE INDEX interactions_workspace_idx ON public.interactions(workspace_id);


-- ============================================================================
-- 11. TABELA: events (agenda)
-- ============================================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,

  type event_type NOT NULL,
  status event_status NOT NULL DEFAULT 'agendado',

  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Protocolo gerado pela Dorinda (ex: VIS-2026-0042)
  protocol_code TEXT UNIQUE,

  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,

  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_minutes_before INTEGER DEFAULT 60,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX events_workspace_idx ON public.events(workspace_id);
CREATE INDEX events_user_starts_idx ON public.events(user_id, starts_at);
CREATE INDEX events_lead_idx ON public.events(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX events_reminder_pending_idx ON public.events(starts_at)
  WHERE reminder_sent = false AND status = 'agendado';

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 12. TABELA: notifications (sino da topbar)
-- ============================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB,

  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;
CREATE INDEX notifications_workspace_idx ON public.notifications(workspace_id);


-- ============================================================================
-- 13. TABELA: chat_conversations
-- ============================================================================
-- Representa uma conversa do chat widget do site (Dorinda).
-- No futuro também vai receber conversas do WhatsApp Business API.
-- ============================================================================
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  visitor_id TEXT NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,

  source TEXT NOT NULL DEFAULT 'chat_widget',
  page_url TEXT,

  status conversation_status NOT NULL DEFAULT 'ai_mode',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  metadata JSONB,
  unread_count INTEGER NOT NULL DEFAULT 0,

  -- Ligação com lead (criada quando a Dorinda qualifica)
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_conversations_workspace_idx ON public.chat_conversations(workspace_id);
CREATE INDEX chat_conversations_visitor_idx ON public.chat_conversations(visitor_id);
CREATE INDEX chat_conversations_status_idx ON public.chat_conversations(workspace_id, status, updated_at DESC);
CREATE INDEX chat_conversations_lead_idx ON public.chat_conversations(lead_id) WHERE lead_id IS NOT NULL;

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 14. TABELA: chat_messages
-- ============================================================================
CREATE TABLE public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  sender_type chat_sender_type NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_conversation_idx ON public.chat_messages(conversation_id, created_at);
CREATE INDEX chat_messages_workspace_idx ON public.chat_messages(workspace_id);


-- ============================================================================
-- 15. TRIGGERS DE NEGÓCIO
-- ============================================================================

-- Trigger: ao criar um usuário em auth.users, criar workspace + profile
-- Essa trigger só é disparada quando alguém se cadastra pela primeira vez.
-- Cria um workspace pessoal e o profile correspondente automaticamente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  user_full_name TEXT;
  user_workspace_name TEXT;
BEGIN
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  user_workspace_name := COALESCE(
    NEW.raw_user_meta_data->>'workspace_name',
    user_full_name || ' Imóveis'
  );

  INSERT INTO public.workspaces (name, slug)
  VALUES (
    user_workspace_name,
    'ws-' || substr(NEW.id::text, 1, 8)
  )
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.profiles (id, workspace_id, full_name, role)
  VALUES (
    NEW.id,
    new_workspace_id,
    user_full_name,
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Trigger: ao mudar o status de um lead, registrar no histórico de interações
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.interactions (workspace_id, lead_id, type, content, metadata)
    VALUES (
      NEW.workspace_id,
      NEW.id,
      'status_change',
      'Status alterado de "' || OLD.status || '" para "' || NEW.status || '"',
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_lead_status_change_trigger
  AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();
