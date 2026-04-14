-- ============================================================================
-- Migration: 0005_property_ref_code
-- Projeto: CRM Leandro Alonso
-- Criado em: 2026-04-14
-- ============================================================================
-- Cria a função `generate_property_ref_code()` que gera códigos de referência
-- únicos por workspace e ano no formato LDR-AAAA-NNNN (ex: LDR-2026-0042).
--
-- A geração usa uma tabela contadora (`property_ref_counters`) com UPSERT
-- atômico — evita race conditions quando duas abas criam imóveis ao mesmo
-- tempo. Cada par (workspace_id, ano) tem seu próprio contador.
--
-- A função roda como SECURITY DEFINER e usa `current_workspace_id()` para
-- inferir o workspace do usuário autenticado (mesmo padrão das policies RLS).
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Tabela contadora
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.property_ref_counters (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, year)
);

COMMENT ON TABLE public.property_ref_counters IS
  'Contador atômico para gerar ref_code de imóveis por workspace e ano. Não exposto via API.';

-- RLS habilitada e fechada — só a função generate_property_ref_code (SECURITY DEFINER) acessa.
ALTER TABLE public.property_ref_counters ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- 2. Função geradora
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_property_ref_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID := public.current_workspace_id();
  v_year INTEGER := EXTRACT(YEAR FROM now())::INTEGER;
  v_seq INTEGER;
BEGIN
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'No workspace context for the current user';
  END IF;

  INSERT INTO public.property_ref_counters (workspace_id, year, last_seq)
  VALUES (v_workspace_id, v_year, 1)
  ON CONFLICT (workspace_id, year)
  DO UPDATE
    SET last_seq = public.property_ref_counters.last_seq + 1,
        updated_at = now()
  RETURNING last_seq INTO v_seq;

  RETURN 'LDR-' || v_year::TEXT || '-' || lpad(v_seq::TEXT, 4, '0');
END;
$$;

COMMENT ON FUNCTION public.generate_property_ref_code() IS
  'Gera um ref_code único (LDR-AAAA-NNNN) para o workspace do usuário autenticado.';

GRANT EXECUTE ON FUNCTION public.generate_property_ref_code() TO authenticated;
