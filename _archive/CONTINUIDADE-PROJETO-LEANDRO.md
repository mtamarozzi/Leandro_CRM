# 📌 Documento de Continuidade — Projeto CRM Leandro Alonso

> **Para quê serve este documento:** resumir TUDO que já foi decidido e trabalhado neste projeto, pra você (ou uma nova conversa com o Claude) retomar do mesmo ponto sem perder contexto.
>
> **Como usar:** cole este documento inteiro como **primeira mensagem** de um chat novo com o Claude. Ele vai ler e já saber em que pé estamos. Pode adicionar uma pergunta ou pedido no final.

---

## 🎯 Visão de alto nível do projeto

Estou construindo um **CRM imobiliário** pro corretor **Leandro Alonso** (CRECI 300771-F, atuando em Santos/SP e região litorânea). A estratégia é em 3 fases:

- **Fase A** (4-6 sem): CRM single-tenant funcional pro Leandro
- **Fase B** (6-8 sem): virar SaaS multi-tenant pra outras imobiliárias
- **Fase C** (contínuo): diferenciação (IA avançada, integrações, WhatsApp Business API)

**Estamos planejando a Fase A agora.** Nada foi codificado ainda — só planejamento e redesign visual.

---

## ✅ O que JÁ foi feito

### 1. Redesign visual do CRM (COMPLETO)
O CRM já existia com front-end básico. Fizemos um redesign completo:
- **Paleta:** cinza (#808080→#3C3C3C) + dourado (#D4A017) — cliente escolheu
- **Estilo:** glassmorphism (vidro fosco, blur, transparências)
- **Dark mode** funcional
- **Logo real** do Leandro (arquivo `Logo_Preta.png` em `public/imagens/`)
- **6 telas redesenhadas:** Dashboard, Leads, Importar, Funil, Empreendimentos, Agenda

Esse redesign foi executado no **Antigravity com Claude** usando uma metodologia específica: um prompt por vez, validação visual, commit entre prompts. Funcionou bem.

**Arquivos de planejamento do redesign visual** (que foram entregues na versão inicial):
- `00-PLANEJAMENTO-GERAL.md`, `01-DESIGN-SYSTEM.md`, `02-TELA-DASHBOARD.md`, ... `10-GUIA-ANTIGRAVITY.md`
- `preview.html` (amostra HTML standalone com todas as telas)

---

## 📋 Decisões tomadas para o planejamento V2 (o que estamos fazendo agora)

### Decisões de stack e arquitetura

| Item | Decisão |
|---|---|
| **Backend** | Supabase (projeto separado do CRM_FVC do advogado — contas diferentes) |
| **Frontend CRM** | React + Vite + Tailwind + Shadcn (já existe, não trocar) |
| **Hospedagem CRM** | Vercel free |
| **Automação** | n8n self-hosted existente (compartilhado com o CRM_FVC, workflows prefixados `[LEANDRO]`) |
| **IA** | OpenAI (Leandro já é assinante) |
| **Email transacional** | Resend free (3k emails/mês) |
| **WhatsApp Fase A** | `wa.me/` (link simples, sem API oficial) |
| **Dorinda (IA Fase A)** | Só no chat widget do site. No WhatsApp, Leandro atende manual. |
| **Dorinda (IA Fase C)** | Migração pra WhatsApp Business API com **número virgem** (requisito Meta) |

### Decisões de produto

- **Dorinda** é o nome da agente IA (não "Mariana" — aquela é do CRM_FVC de advocacia)
- **Dorinda atua 80% sozinha** — Leandro só entra quando ela aciona handoff
- **Coleta nome completo NO FINAL** da conversa, depois de criar rapport (confirmado por análise de concorrente real)
- **Agenda visitas** e cria eventos automaticamente na tabela `events`
- **Qualifica leads no funil** automaticamente (novo → contato → visita → proposta)
- **Gera protocolo** de agendamento (tipo `VIS-2026-0042`) ao final
- Modal "+ Novo Lead" manual continua existindo — pro Leandro anotar retroativamente conversas de WhatsApp

### Decisões de escopo

- **Cliente final da Fase A:** só o Leandro (single-tenant)
- **Pagamento Supabase:** quer esticar o grátis ao máximo
- **Credenciais do Leandro:** ainda não tem todas — desenvolver com contas de teste e migrar no final
- **Site do Leandro:** **JÁ EXISTE** — não vamos criar do zero. É `https://leandro-alonso.vercel.app/` — stack confirmada: **React + Vite + Tailwind + Lucide icons** (sem React Router, sem Supabase ainda, sem Shadcn)

---

## 🗂️ Schema do banco (decidido)

### Tabela principal: `properties`

Decisão importante: **UMA tabela única** pra venda, locação e lançamentos (não tabelas separadas). A distinção é feita pelo campo `purpose`.

Descoberta importante na planilha do Leandro (`Imóveis_para_Locação_e_Venda.xlsx`):
- Aba **Locação** tem 3 imóveis de exemplo, 26 campos
- Aba **Venda** tem 3 imóveis + espaço pra 987 (foco maior do Leandro), 24 campos
- **Lançamentos NÃO são entidade separada** — são apenas imóveis de venda com 2 campos extras: `Empreendimento` e `Construtora`
- 21 campos são comuns entre locação/venda; 6 exclusivos de locação; 5 exclusivos de venda

```sql
CREATE TYPE property_purpose AS ENUM ('venda', 'locacao', 'lancamento');
CREATE TYPE property_kind AS ENUM ('apartamento', 'casa', 'cobertura', 'studio', 'sobrado', 'terreno', 'comercial', 'outro');
CREATE TYPE property_status AS ENUM ('disponivel', 'reservado', 'alugado', 'vendido', 'indisponivel');

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ref_code TEXT UNIQUE,                -- "ALG-SP-001" do Leandro

  purpose property_purpose NOT NULL,
  kind property_kind NOT NULL DEFAULT 'apartamento',
  status property_status NOT NULL DEFAULT 'disponivel',

  -- Empreendimento (opcional, só pra lançamento)
  development_name TEXT,
  developer TEXT,

  -- Localização
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  full_address TEXT,
  floor TEXT,                          -- texto livre ("2º", "Sobreposta")
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
  sale_price NUMERIC(12, 2),           -- venda/lançamento
  rent_price NUMERIC(10, 2),           -- locação
  condo_fee NUMERIC(10, 2),
  iptu NUMERIC(10, 2),
  total_monthly NUMERIC(10, 2),        -- locação (Leandro digita, não calcula)

  -- Locação específico
  guarantee_type TEXT,
  contract_type TEXT,
  min_contract TEXT,
  availability TEXT DEFAULT 'Imediata',

  -- Venda específico
  payment_conditions TEXT,

  -- Descrições
  highlights TEXT,                     -- "Destaques" da planilha (usado pela Dorinda)
  public_description TEXT,             -- longa, pro site público (NOVA)

  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### Outras tabelas planejadas
- `workspaces` (1 só na Fase A)
- `profiles` (estende auth.users)
- `leads` (com campos de IA: score, summary, next_action)
- `lead_empreendimentos` (N:M)
- `interactions` (histórico por lead)
- `events` (agenda, com campo `protocol_code` pra agendamentos gerados pela Dorinda)
- `notifications`
- `chat_conversations` + `chat_messages` (formato relacional novo)
- `media` (fotos dos imóveis no Supabase Storage)

**RLS ativa desde o início** mesmo sendo single-tenant (preparação pra Fase B).

---

## 🤖 A Dorinda (agente IA)

### Prompt atual (do concorrente, a adaptar)
O Leandro (ou alguém que trabalha com ele) tem um prompt base de uma "Dorinda Sintra (SDR Imobiliário)" — arquivo `Prompt_CRMLeandro.md`. Ele tem 6 etapas:
1. Apresentação + coleta de nome
2. Identificação do imóvel
3. Entender objetivo (morar/investir)
4. Perguntar sobre entrada
5. Perguntar sobre renda
6. Convite pra visita

**Problemas identificados** no prompt atual (pra consertar no V2):
- 🔴 Pede nome na etapa 1 (contradiz decisão de "nome no final")
- 🔴 Não tem gatilhos de handoff humano
- 🔴 Assume SOMENTE venda (não cobre locação)
- 🟡 Referencia tool `aptDispo` (abstração n8n) — renomear
- 🟡 Desqualifica leads cedo baseado em entrada/renda (arriscado)

### Análise das conversas do concorrente (Caique Lima)
Recebi 5 screenshots de conversas reais de WhatsApp de um concorrente. Lições extraídas:

**O que ele faz BEM:**
- Abertura natural
- Responde áudio do lead
- Oferece venda + aluguel simultaneamente
- Identifica imóveis reservados em tempo real
- **Coleta nome completo NO FINAL** (confirmação prática da decisão)
- Notificação formatada pro corretor ao final (serve de modelo pro protocolo da Dorinda)

**O que ele faz MAL (Dorinda vai fazer melhor):**
- Repete informações do mesmo imóvel 3-4x na conversa (denuncia bot)
- Termina toda resposta com "quer agendar uma visita?" (script óbvio)
- Zero rapport genuíno (só transacional)
- Não manda fotos
- Nome do lead some no meio da conversa
- Zero emojis

### Novas seções que vou incluir no prompt da Dorinda
- `# ANTI-PADRÕES DE ROBÔ — NUNCA FAÇA` (lições do concorrente ruim)
- `# HANDOFF HUMANO` (quando chamar o Leandro)
- `# FLUXO LOCAÇÃO` (paralelo ao de venda, com caução/fiador em vez de entrada)
- `# REGRAS ANTI-ALUCINAÇÃO` (nunca inventar imóvel, nunca chutar preço)

---

## 🔌 Integrações n8n (já existem no CRM_FVC, vamos duplicar adaptado)

Você me enviou 3 workflows JSON analisados:

### 1. `Mariana_WhatsApp_v2` (41 nós)
- Trigger: WhatsApp Business API
- Processa áudio (transcreve via Whisper) e imagem (upload Supabase Storage)
- AI Agent com OpenAI + memória Postgres (`n8n_chat_histories`)
- Prompt de 9.614 chars em 11 seções
- Detecta `#DADOS_COLETADOS` → extrai campos → cria cobrança Asaas (só no FVC)
- Anti-loop, gestão de upload de documentos
- **Vai ser adaptado pra Dorinda imobiliária** (substituir Asaas por "criar lead + agendar visita")

### 2. `Chat_Widget_AI_v1` (15 nós)
- Webhook recebe mensagens do widget
- Verifica se é visitante, checa status `ai_mode` (permite handoff)
- AI Agent + pausa humanizada
- Extração de nome por regex na resposta ("Prazer, João")
- Persiste em `chat_messages` + `chat_conversations`
- **Vai ser adaptado** pra apontar pro Supabase do Leandro

### 3. `Mariana_FollowUp_Curto_v2` (5 nós)
- Cron a cada 5 min
- SQL complexo pra identificar leads inativos
- Envia follow-up automático
- Anti-spam (flag `is_followup`)
- Atende os 2 canais (WhatsApp + Widget) com queries paralelas
- **Vai ser adaptado** pra contexto imobiliário

### ⚠️ Observação de segurança
Os JSONs enviados provavelmente têm credenciais embutidas (API keys do OpenAI, Postgres, WhatsApp, etc). Você foi alertado a **rotacionar** quando tiver tempo. Eu nunca vou exibir, citar ou referenciar essas credenciais.

---

## 🌐 Site do Leandro — confirmado

- **URL:** `https://leandro-alonso.vercel.app/`
- **Repo:** `C:\Users\User\Documents\Leando_Alonso_Site` (local)
- **Stack confirmada via análise do bundle:**
  - React (41 ocorrências de `createElement`, 29 de `useState/useEffect`)
  - Vite
  - Tailwind
  - Lucide icons
  - **NÃO tem:** React Router, Supabase, Shadcn, Framer Motion
  - Bundle total: 342 KB

**Cenário de integração escolhido:** o site continua onde está, a gente **adiciona**:
1. Chat widget no canto (componente React simples + webhook n8n)
2. Página nova de catálogo público de imóveis (consulta Supabase do Leandro)
3. Página individual de cada imóvel (com galeria, detalhes, CTA pra chat)

---

## 🎯 8 passos do fluxo completo (validados pelo usuário)

1. Leandro cadastra imóveis via formulários no CRM → Supabase
2. Lead chega pelo chat widget do site **OU** pelo wa.me/ (na Fase A, widget é onde a Dorinda atua)
3. Dorinda atende (prompt bem humanizado, ainda a construir)
4. Dorinda consulta Supabase pra responder sobre imóveis reais
5. Imagens dos imóveis no Supabase Storage
6. Dorinda agenda visitas → cria evento na tabela `events` → aparece na agenda do CRM
7. Lead cadastrado automaticamente pela Dorinda (nome + WhatsApp no final)
8. Dorinda qualifica o lead no funil conforme conversa progride (status automático)

**Extras decididos:**
- Modal "+ Novo Lead" manual continua existindo pro Leandro
- Protocolo de agendamento (`VIS-2026-0042`) gerado ao final de cada agendamento
- Handoff pro humano quando Dorinda detecta situações complexas
- Feature sugerida: "Analisar com Dorinda" no modal manual (pra reaproveitar IA em leads offline)

---

## 📁 Estrutura de documentos a entregar (planejamento V2)

Quando o planejamento estiver completo, será um zip com:

```
crm-v2-planejamento/
├── 00-VISAO-GERAL.md               ✅ escrito
├── 01-ARQUITETURA.md               ✅ escrito
├── 02-SCHEMA-DATABASE.md           🟡 precisa atualizar com properties unificada
├── 03-FASE-A-CORE.md               🟡 precisa atualizar sprints (Dorinda, catálogo, n8n)
├── 04-FASE-B-SAAS.md               ✅ escrito
├── 05-FASE-C-DIFERENCIAIS.md       🟡 precisa atualizar seção WhatsApp (número virgem)
├── 06-INTEGRACOES.md               ✅ escrito
├── 07-DEPLOY.md                    ✅ escrito
├── 08-METODOLOGIA.md               ✅ escrito
├── 09-INTEGRACAO-N8N.md            ⬜ a criar (novo)
├── 10-DORINDA-PERSONA.md           ⬜ a criar (novo)
├── 11-CHAT-WIDGET-LEANDRO.md       ⬜ a criar (novo)
├── 12-CATALOGO-PUBLICO.md          ⬜ a criar (novo)
└── 13-TELA-IMOVEIS.md              ⬜ a criar (novo)
```

**Primeira versão** (antes das descobertas do n8n, Dorinda, imóveis) já foi entregue em `crm-v2-planejamento.zip`. O V2 atualiza quase tudo e adiciona 5 documentos novos.

---

## 🚧 Checklist de pendências

### ✅ Já temos
- [x] Stack do site confirmada (React + Vite + Tailwind + Lucide)
- [x] Schema de locação analisado
- [x] Schema de venda analisado
- [x] Lançamentos serão dentro de `properties`, não tabela separada
- [x] Prompt base da Dorinda recebido e analisado
- [x] Conversas do concorrente analisadas
- [x] Workflows n8n analisados
- [x] Caminhos locais do CRM e do site confirmados

### 🟡 Bloqueios atuais
- [ ] Acesso via Filesystem às pastas `Leandro_CRM` e `Leando_Alonso_Site` (ainda só tem `CRM_FVC` liberado)
- [ ] Leandro não tem algumas credenciais ainda (OpenAI já tem, outras pendentes)

### ⬜ A construir juntos
- [ ] Prompt completo da Dorinda adaptado pra imobiliário (Leandro ajuda)
- [ ] Adaptar os 3 workflows n8n pra novo contexto
- [ ] UX do wizard de cadastro de imóvel (4 passos)
- [ ] UX do catálogo público no site

---

## 🎬 Próxima ação imediata

Liberar acesso via Filesystem às 2 pastas:
- `C:\Users\User\Documents\Leandro_CRM`
- `C:\Users\User\Documents\Leando_Alonso_Site`

Configuração a fazer no `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\User\\Documents\\CRM_FVC",
        "C:\\Users\\User\\Documents\\Leandro_CRM",
        "C:\\Users\\User\\Documents\\Leando_Alonso_Site"
      ]
    }
  }
}
```

Depois: fechar e reabrir o Claude Desktop completamente, e testar nesta conversa (ou abrir nova com este documento colado).

---

## 💬 Informações que o Claude vai precisar toda vez

- **Nome do projeto:** CRM Leandro Alonso (imobiliário, Santos/SP)
- **Cliente zero:** Leandro Alonso (CRECI 300771-F)
- **Paleta:** Cinza + Dourado (#D4A017 é a primária)
- **Ambiente de trabalho:** Antigravity com Claude
- **Metodologia:** um prompt por vez, validação, commit, próximo
- **Tudo que for decidido por escrito** deve virar arquivo markdown num zip pronto pra colar em `docs/`
