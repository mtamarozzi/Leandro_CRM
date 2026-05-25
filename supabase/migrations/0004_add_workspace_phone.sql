-- ============================================================================
-- Migration: 0004_add_workspace_phone
-- Projeto: CRM Leandro Alonso
-- Criado em: 2026-04-14
-- ============================================================================
-- Adiciona a coluna `phone` na tabela `workspaces` para armazenar o telefone
-- público da imobiliária, exibido na tela de Configurações (sub-bloco 3.2)
-- e destinado ao click-to-WhatsApp do catálogo público na Etapa 6.
--
-- Coluna nullable — workspaces criados antes desta migration continuam válidos.
-- ============================================================================

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.workspaces.phone IS
  'Telefone público da imobiliária (WhatsApp). Usado pelo catálogo público e pela tela de Configurações.';
