-- ============================================================================
-- Migration: 0007_n8n_chat_histories
-- Projeto: CRM Leandro Alonso
-- Criado em: 2026-05-13
-- ============================================================================
-- Cria a tabela `n8n_chat_histories`, usada pelo nó "Postgres Chat Memory"
-- do n8n (pacote @n8n/n8n-nodes-langchain) para persistir a memória de cada
-- conversa do AI Agent da Dorinda.
--
-- Schema esperado pela classe `PostgresChatMessageHistory` do LangChain
-- (versão Node.js, que é a que o n8n usa internamente):
--   - id          SERIAL PRIMARY KEY
--   - session_id  TEXT/VARCHAR (não nulo)
--   - message     JSONB (não nulo) — objeto LangChain { type, data: {...} }
--
-- No workflow `[LEANDRO] Chat Widget AI`, o `sessionKey` é definido como
-- `chat_web_{conversation_id}`, então cada conversa do chat widget terá
-- sua própria sequência de mensagens nessa tabela.
--
-- RLS é habilitada sem policies: o n8n conecta com a credencial de service
-- role do Supabase, que ignora RLS. Nenhum cliente authenticated/anon
-- precisa ler essa tabela — o histórico volta para o frontend via
-- `chat_messages` (tabela já existente).
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Tabela
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.n8n_chat_histories (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,
  message     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.n8n_chat_histories IS
  'Memória do AI Agent da Dorinda (n8n LangChain Postgres Chat Memory). Acessada apenas via service_role.';

COMMENT ON COLUMN public.n8n_chat_histories.session_id IS
  'Chave de sessão usada pelo nó Memory do n8n. Padrão: chat_web_<conversation_id>.';

COMMENT ON COLUMN public.n8n_chat_histories.message IS
  'Mensagem LangChain serializada: { type: "human"|"ai"|"system", data: { content, additional_kwargs, ... } }.';


-- ---------------------------------------------------------------------------
-- 2. Índice de leitura por sessão
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_session
  ON public.n8n_chat_histories (session_id, id);


-- ---------------------------------------------------------------------------
-- 3. RLS habilitada sem policies (service_role only)
-- ---------------------------------------------------------------------------

ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
