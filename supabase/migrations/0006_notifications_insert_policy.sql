-- ============================================================================
-- Migration: 0006_notifications_insert_policy
-- Projeto: CRM Leandro Alonso
-- Criado em: 2026-04-14
-- ============================================================================
-- A tabela `notifications` tinha RLS habilitada mas só com policies de
-- SELECT/UPDATE/DELETE. Sem INSERT, qualquer tentativa do front-end de criar
-- uma notificação falhava silenciosamente — descoberto durante o sub-bloco 3.6.
--
-- Esta policy permite que usuários autenticados insiram notificações para
-- si mesmos no próprio workspace.
-- ============================================================================

CREATE POLICY "notifications_insert_own"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND workspace_id = public.current_workspace_id()
  );
