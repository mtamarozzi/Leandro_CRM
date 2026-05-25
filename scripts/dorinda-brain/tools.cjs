// scripts/dorinda-brain/tools.cjs
const FUNCTION_DECLARATIONS = [
  {
    name: 'consultar_imoveis',
    description: 'Busca imóveis no catálogo do Leandro com filtros opcionais. Use sempre que o lead descrever o que procura. NUNCA invente imóvel — chame esta tool antes de citar características. Retorna {ok, count, results[]}.',
    parameters: {
      type: 'object',
      properties: {
        p_city: { type: 'string', description: 'Cidade (ex.: Santos). Omita se não mencionado.' },
        p_neighborhood: { type: 'string', description: 'Bairro. Omita se não mencionado.' },
        p_purpose: { type: 'string', description: 'venda ou locacao. Omita se não mencionado.', enum: ['venda', 'locacao'] },
        p_kind: { type: 'string', description: 'Tipo: apartamento, casa, cobertura, studio, etc. Omita se não mencionado.' },
        p_min_bedrooms: { type: 'integer', description: 'Mínimo de dormitórios.' },
        p_max_bedrooms: { type: 'integer', description: 'Máximo de dormitórios.' },
        p_max_sale_price: { type: 'number', description: 'Preço máximo de venda em reais (ex.: 800000).' },
        p_max_rent_price: { type: 'number', description: 'Aluguel máximo em reais.' },
        p_pet_friendly: { type: 'boolean', description: 'Aceita pet.' },
        p_is_furnished: { type: 'boolean', description: 'Mobiliado.' },
        p_limit: { type: 'integer', description: 'Máximo de resultados (default 5).' },
      },
    },
  },
  {
    name: 'consultar_imovel_por_id',
    description: 'Busca detalhes COMPLETOS de UM imóvel pelo UUID ou ref_code (ex.: LDR-2026-0002). Use quando o lead pedir mais detalhes. Retorna mesmo imóveis vendidos/alugados com campo status.',
    parameters: {
      type: 'object',
      properties: {
        p_identifier: { type: 'string', description: 'UUID do imóvel OU ref_code (ex.: LDR-2026-0002). Obrigatório.' },
      },
      required: ['p_identifier'],
    },
  },
  {
    name: 'criar_lead',
    description: 'Cria (ou atualiza pelo telefone) um lead no CRM. CHAME APENAS depois que o lead compartilhou nome completo E WhatsApp espontaneamente, na etapa final. Merge não-destrutivo. Retorna {ok, lead_id, was_existing, linked_properties}.',
    parameters: {
      type: 'object',
      properties: {
        p_name: { type: 'string', description: 'Nome completo do lead. Obrigatório.' },
        p_phone: { type: 'string', description: 'WhatsApp em qualquer formato (a função normaliza). Obrigatório.' },
        p_interest: { type: 'string', description: 'Resumo do interesse em 1 frase.' },
        p_interest_purpose: { type: 'string', description: 'venda ou locacao.', enum: ['venda', 'locacao'] },
        p_property_ids: { type: 'array', items: { type: 'string' }, description: 'Array de UUIDs dos imóveis de interesse. Use [] se nenhum.' },
        p_conversation_id: { type: 'string', description: 'UUID da conversa atual do widget.' },
        p_ai_summary: { type: 'string', description: 'Síntese da conversa em 1-2 frases.' },
      },
      required: ['p_name', 'p_phone'],
    },
  },
  {
    name: 'agendar_visita',
    description: 'Agenda visita do lead a um imóvel. Use SOMENTE quando o lead confirmou data/hora E forneceu nome + WhatsApp. Cria o lead automaticamente se não existir (não chame criar_lead antes). Retorna {ok, event_id, lead_id, protocol_code (VIS-2026-NNNN), human_readable}. SEMPRE inclua o protocol_code na confirmação. Em conflito de horário retorna {ok:false, error:"conflict"}; em erro de validação, JSON tem "stage".',
    parameters: {
      type: 'object',
      properties: {
        p_property_id: { type: 'string', description: 'UUID do imóvel (NÃO o ref_code — use o id retornado por consultar_imoveis). Obrigatório.' },
        p_lead_phone: { type: 'string', description: 'WhatsApp do lead. Obrigatório.' },
        p_lead_name: { type: 'string', description: 'Nome completo do lead. Obrigatório.' },
        p_starts_at: { type: 'string', description: 'Início em ISO 8601 com timezone (ex.: "2026-05-25T14:00:00-03:00"). Futuro, até 90 dias. Obrigatório.' },
        p_duration_minutes: { type: 'integer', description: 'Duração em minutos. Default 60.' },
        p_conversation_id: { type: 'string', description: 'UUID da conversa atual.' },
        p_notes: { type: 'string', description: 'Observações sobre a visita.' },
      },
      required: ['p_property_id', 'p_lead_phone', 'p_lead_name', 'p_starts_at'],
    },
  },
  {
    name: 'notificar_corretor',
    description: 'Aciona o Leandro (handoff). Use nos casos da seção HANDOFF do prompt. Com urgencia="alta", a conversa vira human_mode e você para de responder. Retorna {ok, notification_id, conversation_switched_to_human}.',
    parameters: {
      type: 'object',
      properties: {
        p_tipo: { type: 'string', description: 'Tipo da notificação (ex.: handoff, visita_agendada). Obrigatório.' },
        p_mensagem: { type: 'string', description: 'Mensagem pro corretor explicando o contexto. Obrigatório.' },
        p_urgencia: { type: 'string', description: 'baixa, media ou alta. Default media.', enum: ['baixa', 'media', 'alta'] },
        p_conversation_id: { type: 'string', description: 'UUID da conversa atual.' },
      },
      required: ['p_tipo', 'p_mensagem'],
    },
  },
];

module.exports = { FUNCTION_DECLARATIONS };
