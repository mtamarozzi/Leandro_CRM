-- ============================================================================
-- Migration: 0008_dorinda_rpcs
-- Projeto:   CRM Leandro Alonso
-- Criado em: 2026-05-22
-- Contrato:  docs/04-DORINDA-TOOLS-CONTRACT.md (v0.2)
-- ============================================================================
-- Cria as 5 RPCs que o AI Agent do workflow [LEANDRO] Chat_Widget_AI_v1
-- (n8n) consome como HTTP Tools, mais helpers internos e uma sequence para
-- geração de protocolo de visita (VIS-YYYY-NNNN).
--
-- Convenções (decisões 1 a 6 aprovadas em 2026-05-22):
--   1. Todas as funções são SECURITY DEFINER + search_path fixo.
--   2. GRANT EXECUTE TO anon (a credential HTTP do n8n usa a anon key).
--   3. RLS continua ativo nas tabelas — só essas funções são porta autorizada.
--   4. Single-tenant (Fase A): workspace é resolvido pelo helper
--      dorinda_default_workspace_id().
--   5. Dedup de lead por telefone usa comparação normalizada (só dígitos).
--      Índice funcional criado no final para suportar.
--   6. Notificações reutilizam enum existente (sem dorinda_alert).
--      Discriminação por metadata.source = 'dorinda'.
-- ============================================================================


-- ============================================================================
-- 1. SEQUENCE pra protocolo de visita (VIS-2026-0042)
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.dorinda_protocol_seq START 1;


-- ============================================================================
-- 2. HELPERS INTERNOS
-- ============================================================================

-- 2.1 workspace default (single-tenant na Fase A)
CREATE OR REPLACE FUNCTION public.dorinda_default_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.workspaces ORDER BY created_at ASC LIMIT 1;
$$;

-- 2.2 user_id do corretor responsável (Leandro = único profile com role='admin')
CREATE OR REPLACE FUNCTION public.dorinda_owner_user_id(p_workspace_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.profiles
  WHERE workspace_id = p_workspace_id AND role = 'admin'
  ORDER BY created_at ASC LIMIT 1;
$$;

-- 2.3 próximo protocolo no formato VIS-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.dorinda_next_protocol_code()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 'VIS-' || to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY')
         || '-' || lpad(nextval('public.dorinda_protocol_seq')::text, 4, '0');
$$;

-- 2.4 normalização de telefone (só dígitos)
CREATE OR REPLACE FUNCTION public.dorinda_normalize_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
$$;

-- 2.5 formatador de data em PT-BR ("sexta-feira, 23 de maio às 14h00")
CREATE OR REPLACE FUNCTION public.dorinda_format_ptbr(p_ts TIMESTAMPTZ)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_local TIMESTAMP := p_ts AT TIME ZONE 'America/Sao_Paulo';
  v_dow   TEXT;
  v_month TEXT;
BEGIN
  v_dow := CASE EXTRACT(DOW FROM v_local)::INT
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'segunda-feira'
    WHEN 2 THEN 'terça-feira'
    WHEN 3 THEN 'quarta-feira'
    WHEN 4 THEN 'quinta-feira'
    WHEN 5 THEN 'sexta-feira'
    WHEN 6 THEN 'sábado'
  END;
  v_month := CASE EXTRACT(MONTH FROM v_local)::INT
    WHEN 1 THEN 'janeiro'   WHEN 2 THEN 'fevereiro' WHEN 3 THEN 'março'
    WHEN 4 THEN 'abril'     WHEN 5 THEN 'maio'      WHEN 6 THEN 'junho'
    WHEN 7 THEN 'julho'     WHEN 8 THEN 'agosto'    WHEN 9 THEN 'setembro'
    WHEN 10 THEN 'outubro'  WHEN 11 THEN 'novembro' WHEN 12 THEN 'dezembro'
  END;
  RETURN v_dow || ', ' || EXTRACT(DAY FROM v_local)::TEXT || ' de ' || v_month
         || ' às ' || to_char(v_local, 'HH24"h"MI');
END;
$$;


-- ============================================================================
-- 3. RPC 1: dorinda_consultar_imoveis
-- ============================================================================
CREATE OR REPLACE FUNCTION public.dorinda_consultar_imoveis(
  p_city           TEXT             DEFAULT NULL,
  p_neighborhood   TEXT             DEFAULT NULL,
  p_purpose        property_purpose DEFAULT NULL,
  p_kind           property_kind    DEFAULT NULL,
  p_min_bedrooms   INTEGER          DEFAULT NULL,
  p_max_bedrooms   INTEGER          DEFAULT NULL,
  p_max_sale_price NUMERIC          DEFAULT NULL,
  p_max_rent_price NUMERIC          DEFAULT NULL,
  p_pet_friendly   BOOLEAN          DEFAULT NULL,
  p_is_furnished   BOOLEAN          DEFAULT NULL,
  p_limit          INTEGER          DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id UUID := public.dorinda_default_workspace_id();
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 5), 1), 10);
  v_results jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb) INTO v_results
  FROM (
    SELECT jsonb_build_object(
      'id',             p.id,
      'ref_code',       p.ref_code,
      'purpose',        p.purpose,
      'kind',           p.kind,
      'status',         p.status,
      'city',           p.city,
      'neighborhood',   p.neighborhood,
      'bedrooms',       p.bedrooms,
      'suites',         p.suites,
      'parking_spots',  p.parking_spots,
      'usable_area_m2', p.usable_area_m2,
      'sale_price',     p.sale_price,
      'rent_price',     p.rent_price,
      'condo_fee',      p.condo_fee,
      'iptu',           p.iptu,
      'total_monthly',  p.total_monthly,
      'pet_friendly',   p.pet_friendly,
      'is_furnished',   p.is_furnished,
      'highlights',     p.highlights,
      'cover_url',      cover.url
    ) AS row
    FROM public.properties p
    LEFT JOIN LATERAL (
      SELECT url FROM public.media m
      WHERE m.property_id = p.id
      ORDER BY m.is_cover DESC, m.display_order ASC
      LIMIT 1
    ) cover ON true
    WHERE p.workspace_id = v_ws_id
      AND p.deleted_at IS NULL
      AND p.is_public = true
      AND p.status NOT IN ('indisponivel', 'vendido', 'alugado')
      AND (p_city         IS NULL OR p.city         ILIKE '%' || p_city || '%')
      AND (p_neighborhood IS NULL OR p.neighborhood ILIKE '%' || p_neighborhood || '%')
      AND (p_purpose      IS NULL OR p.purpose      = p_purpose)
      AND (p_kind         IS NULL OR p.kind         = p_kind)
      AND (p_min_bedrooms IS NULL OR p.bedrooms     >= p_min_bedrooms)
      AND (p_max_bedrooms IS NULL OR p.bedrooms     <= p_max_bedrooms)
      AND (p_max_sale_price IS NULL OR (p.sale_price IS NOT NULL AND p.sale_price <= p_max_sale_price))
      AND (p_max_rent_price IS NULL OR (p.rent_price IS NOT NULL AND p.rent_price <= p_max_rent_price))
      AND (p_pet_friendly IS NULL OR p.pet_friendly = p_pet_friendly)
      AND (p_is_furnished IS NULL OR p.is_furnished = p_is_furnished)
    ORDER BY p.is_featured DESC, p.updated_at DESC
    LIMIT v_limit
  ) sub;

  RETURN jsonb_build_object(
    'ok',      true,
    'count',   jsonb_array_length(v_results),
    'results', v_results
  );
END;
$$;


-- ============================================================================
-- 4. RPC 2: dorinda_consultar_imovel_por_id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.dorinda_consultar_imovel_por_id(
  p_identifier TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id UUID := public.dorinda_default_workspace_id();
  v_uuid UUID;
  v_property RECORD;
  v_media jsonb;
BEGIN
  -- aceita UUID OU ref_code
  BEGIN
    v_uuid := p_identifier::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_uuid := NULL;
  END;

  SELECT * INTO v_property
  FROM public.properties
  WHERE workspace_id = v_ws_id
    AND deleted_at IS NULL
    AND (
      (v_uuid IS NOT NULL AND id = v_uuid)
      OR (v_uuid IS NULL AND upper(ref_code) = upper(p_identifier))
    )
  LIMIT 1;

  IF v_property.id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'not_found',
      'message', 'Imóvel não encontrado.'
    );
  END IF;

  SELECT COALESCE(jsonb_agg(row ORDER BY display_order ASC), '[]'::jsonb) INTO v_media
  FROM (
    SELECT jsonb_build_object(
      'url', url,
      'caption', caption,
      'display_order', display_order,
      'is_cover', is_cover
    ) AS row,
    display_order
    FROM public.media
    WHERE property_id = v_property.id
    ORDER BY is_cover DESC, display_order ASC
    LIMIT 6
  ) m;

  RETURN jsonb_build_object(
    'ok',                true,
    'id',                v_property.id,
    'ref_code',          v_property.ref_code,
    'purpose',           v_property.purpose,
    'kind',              v_property.kind,
    'status',            v_property.status,
    'city',              v_property.city,
    'neighborhood',      v_property.neighborhood,
    'full_address',      v_property.full_address,
    'floor',             v_property.floor,
    'bedrooms',          v_property.bedrooms,
    'suites',            v_property.suites,
    'bathrooms',         v_property.bathrooms,
    'parking_spots',     v_property.parking_spots,
    'garage_type',       v_property.garage_type,
    'usable_area_m2',    v_property.usable_area_m2,
    'is_furnished',      v_property.is_furnished,
    'has_balcony',       v_property.has_balcony,
    'pet_friendly',      v_property.pet_friendly,
    'sale_price',        v_property.sale_price,
    'rent_price',        v_property.rent_price,
    'condo_fee',         v_property.condo_fee,
    'iptu',              v_property.iptu,
    'total_monthly',     v_property.total_monthly,
    'guarantee_type',    v_property.guarantee_type,
    'contract_type',     v_property.contract_type,
    'min_contract',      v_property.min_contract,
    'availability',      v_property.availability,
    'payment_conditions',v_property.payment_conditions,
    'development_name',  v_property.development_name,
    'developer',         v_property.developer,
    'highlights',        v_property.highlights,
    'public_description',v_property.public_description,
    'media',             v_media
  );
END;
$$;


-- ============================================================================
-- 5. RPC 3: dorinda_criar_lead
-- ============================================================================
CREATE OR REPLACE FUNCTION public.dorinda_criar_lead(
  p_name              TEXT,
  p_phone             TEXT,
  p_interest          TEXT             DEFAULT NULL,
  p_interest_purpose  property_purpose DEFAULT NULL,
  p_property_ids      UUID[]           DEFAULT NULL,
  p_conversation_id   UUID             DEFAULT NULL,
  p_ai_summary        TEXT             DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id UUID := public.dorinda_default_workspace_id();
  v_phone_norm TEXT := public.dorinda_normalize_phone(p_phone);
  v_lead_id UUID;
  v_was_existing BOOLEAN := false;
  v_linked INTEGER := 0;
  v_prop_id UUID;
BEGIN
  -- validações
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_name', 'message', 'Nome é obrigatório.');
  END IF;
  IF length(v_phone_norm) < 10 OR length(v_phone_norm) > 13 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_phone', 'message', 'Telefone deve ter 10 a 13 dígitos.');
  END IF;

  -- dedup por telefone normalizado
  SELECT id INTO v_lead_id
  FROM public.leads
  WHERE workspace_id = v_ws_id
    AND deleted_at IS NULL
    AND regexp_replace(phone, '[^0-9]', '', 'g') = v_phone_norm
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    -- merge não-destrutivo
    v_was_existing := true;
    UPDATE public.leads
       SET name              = COALESCE(NULLIF(btrim(p_name), ''), name),
           interest_type     = COALESCE(p_interest, interest_type),
           interest_purpose  = COALESCE(p_interest_purpose, interest_purpose),
           ai_summary        = COALESCE(p_ai_summary, ai_summary),
           ai_analyzed_at    = now(),
           last_contact_at   = now()
     WHERE id = v_lead_id;
  ELSE
    INSERT INTO public.leads (
      workspace_id, name, phone, status, origin,
      interest_type, interest_purpose,
      ai_summary, ai_analyzed_at, last_contact_at
    ) VALUES (
      v_ws_id, btrim(p_name), p_phone, 'novo', 'chat_widget',
      p_interest, p_interest_purpose,
      p_ai_summary, now(), now()
    )
    RETURNING id INTO v_lead_id;
  END IF;

  -- vincula imóveis de interesse (ignora duplicatas)
  IF p_property_ids IS NOT NULL THEN
    FOREACH v_prop_id IN ARRAY p_property_ids LOOP
      BEGIN
        INSERT INTO public.lead_properties (lead_id, property_id, workspace_id, interest_level)
        SELECT v_lead_id, v_prop_id, v_ws_id, 3
        WHERE EXISTS (
          SELECT 1 FROM public.properties
          WHERE id = v_prop_id AND workspace_id = v_ws_id AND deleted_at IS NULL
        )
        ON CONFLICT (lead_id, property_id) DO NOTHING;
        IF FOUND THEN v_linked := v_linked + 1; END IF;
      EXCEPTION WHEN OTHERS THEN
        -- ignora falha individual, continua
        NULL;
      END;
    END LOOP;
  END IF;

  -- vincula a conversa do widget se passada
  IF p_conversation_id IS NOT NULL THEN
    UPDATE public.chat_conversations
       SET lead_id        = v_lead_id,
           visitor_name   = COALESCE(visitor_name, btrim(p_name)),
           visitor_phone  = COALESCE(visitor_phone, p_phone)
     WHERE id = p_conversation_id AND workspace_id = v_ws_id;
  END IF;

  -- registra interaction
  INSERT INTO public.interactions (workspace_id, lead_id, type, content, metadata)
  VALUES (
    v_ws_id, v_lead_id, 'ai_action',
    CASE WHEN v_was_existing THEN 'Dorinda atualizou lead via chat widget'
         ELSE 'Dorinda criou lead via chat widget' END,
    jsonb_build_object(
      'source', 'dorinda',
      'conversation_id', p_conversation_id,
      'ai_summary', p_ai_summary,
      'was_existing', v_was_existing,
      'linked_properties', v_linked
    )
  );

  RETURN jsonb_build_object(
    'ok',                true,
    'lead_id',           v_lead_id,
    'was_existing',      v_was_existing,
    'linked_properties', v_linked
  );
END;
$$;


-- ============================================================================
-- 6. RPC 4: dorinda_agendar_visita
-- ============================================================================
CREATE OR REPLACE FUNCTION public.dorinda_agendar_visita(
  p_property_id      UUID,
  p_lead_phone       TEXT,
  p_lead_name        TEXT,
  p_starts_at        TIMESTAMPTZ,
  p_duration_minutes INTEGER DEFAULT 60,
  p_conversation_id  UUID    DEFAULT NULL,
  p_notes            TEXT    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id UUID := public.dorinda_default_workspace_id();
  v_owner_id UUID := public.dorinda_owner_user_id(v_ws_id);
  v_phone_norm TEXT := public.dorinda_normalize_phone(p_lead_phone);
  v_lead_id UUID;
  v_property RECORD;
  v_conflict_id UUID;
  v_conflict_starts_at TIMESTAMPTZ;
  v_protocol TEXT;
  v_event_id UUID;
  v_lead_created jsonb;
  v_title TEXT;
  v_location TEXT;
  v_ends_at TIMESTAMPTZ;
BEGIN
  -- validações de input (stage = validation)
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'stage', 'validation', 'error', 'no_owner', 'message', 'Nenhum corretor admin configurado no workspace.');
  END IF;
  IF p_starts_at IS NULL OR p_starts_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'stage', 'validation', 'error', 'invalid_starts_at', 'message', 'Horário precisa estar no futuro.');
  END IF;
  IF p_starts_at > now() + interval '90 days' THEN
    RETURN jsonb_build_object('ok', false, 'stage', 'validation', 'error', 'too_far_future', 'message', 'Agendamento limitado a 90 dias.');
  END IF;
  IF length(v_phone_norm) < 10 OR length(v_phone_norm) > 13 THEN
    RETURN jsonb_build_object('ok', false, 'stage', 'validation', 'error', 'invalid_phone', 'message', 'Telefone do lead inválido.');
  END IF;

  -- valida imóvel (stage = property_lookup)
  SELECT id, ref_code, full_address, city, neighborhood, status
    INTO v_property
    FROM public.properties
   WHERE id = p_property_id
     AND workspace_id = v_ws_id
     AND deleted_at IS NULL
   LIMIT 1;

  IF v_property.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'stage', 'property_lookup', 'error', 'property_not_found', 'message', 'Imóvel não encontrado.');
  END IF;
  IF v_property.status IN ('vendido', 'alugado') THEN
    RETURN jsonb_build_object('ok', false, 'stage', 'property_lookup', 'error', 'property_unavailable', 'message', 'Imóvel já está ' || v_property.status::TEXT || '.');
  END IF;

  -- resolve lead (cria se não existir, via mesma RPC) — stage = lead_resolution
  SELECT id INTO v_lead_id
    FROM public.leads
   WHERE workspace_id = v_ws_id
     AND deleted_at IS NULL
     AND regexp_replace(phone, '[^0-9]', '', 'g') = v_phone_norm
   ORDER BY created_at ASC
   LIMIT 1;

  IF v_lead_id IS NULL THEN
    v_lead_created := public.dorinda_criar_lead(
      p_name            => p_lead_name,
      p_phone           => p_lead_phone,
      p_property_ids    => ARRAY[p_property_id],
      p_conversation_id => p_conversation_id
    );
    IF (v_lead_created->>'ok')::BOOLEAN = false THEN
      -- envelopa o erro do criar_lead pra o AI Agent saber em que etapa falhou
      RETURN jsonb_build_object(
        'ok', false,
        'stage', 'lead_resolution',
        'error', 'lead_creation_failed',
        'message', 'Não foi possível criar o lead para agendar a visita.',
        'lead_error', v_lead_created
      );
    END IF;
    v_lead_id := (v_lead_created->>'lead_id')::UUID;
  END IF;

  -- detecta conflito (stage = conflict_check, zona de exclusão 60 min antes/depois)
  SELECT id, starts_at INTO v_conflict_id, v_conflict_starts_at
    FROM public.events
   WHERE user_id = v_owner_id
     AND type = 'visita'
     AND status NOT IN ('cancelado', 'nao_compareceu')
     AND starts_at BETWEEN (p_starts_at - interval '60 minutes')
                       AND (p_starts_at + interval '60 minutes')
   ORDER BY starts_at ASC
   LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'stage', 'conflict_check',
      'error', 'conflict',
      'message', 'Já existe visita na janela de 60min do horário solicitado.',
      'conflicting_event_id', v_conflict_id,
      'conflicting_starts_at', v_conflict_starts_at
    );
  END IF;

  -- gera protocolo e dados auxiliares
  v_protocol := public.dorinda_next_protocol_code();
  v_title := 'Visita - ' || COALESCE(v_property.ref_code, 'imóvel ' || left(v_property.id::TEXT, 8));
  v_location := COALESCE(v_property.full_address, v_property.neighborhood || ', ' || v_property.city);
  v_ends_at := p_starts_at + (COALESCE(p_duration_minutes, 60) || ' minutes')::interval;

  -- INSERT evento
  INSERT INTO public.events (
    workspace_id, user_id, lead_id, property_id,
    type, status, title, description, location,
    protocol_code, starts_at, ends_at, reminder_minutes_before
  ) VALUES (
    v_ws_id, v_owner_id, v_lead_id, p_property_id,
    'visita', 'agendado', v_title, p_notes, v_location,
    v_protocol, p_starts_at, v_ends_at, 90
  )
  RETURNING id INTO v_event_id;

  -- move lead para status 'visita' (trigger log_lead_status_change registra interaction)
  UPDATE public.leads
     SET status = 'visita',
         last_contact_at = now()
   WHERE id = v_lead_id AND status NOT IN ('visita', 'proposta', 'ganho');

  -- interaction explícita do tipo visit
  INSERT INTO public.interactions (workspace_id, lead_id, type, content, metadata)
  VALUES (
    v_ws_id, v_lead_id, 'visit',
    'Visita agendada pela Dorinda — ' || v_protocol,
    jsonb_build_object(
      'source', 'dorinda',
      'event_id', v_event_id,
      'protocol_code', v_protocol,
      'property_id', p_property_id,
      'conversation_id', p_conversation_id,
      'starts_at', p_starts_at
    )
  );

  RETURN jsonb_build_object(
    'ok',             true,
    'event_id',       v_event_id,
    'lead_id',        v_lead_id,
    'protocol_code',  v_protocol,
    'starts_at',      p_starts_at,
    'ends_at',        v_ends_at,
    'human_readable', public.dorinda_format_ptbr(p_starts_at)
  );
END;
$$;


-- ============================================================================
-- 7. RPC 5: dorinda_notificar_corretor
-- ============================================================================
CREATE OR REPLACE FUNCTION public.dorinda_notificar_corretor(
  p_tipo             TEXT,
  p_mensagem         TEXT,
  p_urgencia         TEXT  DEFAULT 'media',
  p_conversation_id  UUID  DEFAULT NULL,
  p_lead_id          UUID  DEFAULT NULL,
  p_metadata         JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id UUID := public.dorinda_default_workspace_id();
  v_owner_id UUID := public.dorinda_owner_user_id(v_ws_id);
  v_type notification_type;
  v_title TEXT;
  v_metadata JSONB;
  v_notification_id UUID;
  v_switched BOOLEAN := false;
  v_row_count INTEGER;
  v_lead_name TEXT;
BEGIN
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_owner', 'message', 'Sem corretor admin para notificar.');
  END IF;
  IF p_mensagem IS NULL OR btrim(p_mensagem) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_message', 'message', 'Mensagem é obrigatória.');
  END IF;
  IF COALESCE(p_urgencia, 'media') NOT IN ('baixa', 'media', 'alta') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_urgencia', 'message', 'Urgência deve ser baixa, media ou alta.');
  END IF;

  -- mapeia p_tipo (decisão #2)
  IF p_tipo = 'handoff' THEN
    v_type := 'ai_handoff';
    v_title := '🟠 Dorinda pediu sua ajuda — ' || left(p_mensagem, 60);
  ELSIF p_tipo = 'novo_lead' THEN
    v_type := 'new_lead';
    IF p_lead_id IS NOT NULL THEN
      SELECT name INTO v_lead_name FROM public.leads WHERE id = p_lead_id;
    END IF;
    v_title := '🟢 Novo lead pelo chat' || COALESCE(' — ' || v_lead_name, '');
  ELSIF p_tipo = 'visita_agendada' THEN
    v_type := 'event_reminder';
    v_title := '📅 Visita agendada pela Dorinda' || COALESCE(' — ' || (p_metadata->>'protocol_code'), '');
  ELSIF p_tipo = 'situacao_complexa' THEN
    v_type := 'ai_insight';
    v_title := '💡 Dorinda detectou algo no atendimento';
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_tipo',
      'message', 'p_tipo deve ser handoff, novo_lead, visita_agendada ou situacao_complexa.');
  END IF;

  -- monta metadata final
  v_metadata := COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
    'source', 'dorinda',
    'subtipo', p_tipo,
    'urgencia', COALESCE(p_urgencia, 'media'),
    'conversation_id', p_conversation_id,
    'lead_id', p_lead_id
  );

  -- INSERT notification
  INSERT INTO public.notifications (
    workspace_id, user_id, type, title, body, link, metadata
  ) VALUES (
    v_ws_id, v_owner_id, v_type,
    -- permite override de title via metadata.title
    COALESCE(p_metadata->>'title', v_title),
    p_mensagem,
    CASE
      WHEN p_lead_id IS NOT NULL THEN '/leads/' || p_lead_id::TEXT
      WHEN p_conversation_id IS NOT NULL THEN '/chat/' || p_conversation_id::TEXT
      ELSE NULL
    END,
    v_metadata
  )
  RETURNING id INTO v_notification_id;

  -- urgência alta + conversa: muda pra human_mode (Dorinda para de responder)
  IF p_urgencia = 'alta' AND p_conversation_id IS NOT NULL THEN
    UPDATE public.chat_conversations
       SET status = 'human_mode',
           assigned_to = v_owner_id
     WHERE id = p_conversation_id
       AND workspace_id = v_ws_id
       AND status = 'ai_mode';
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_switched := v_row_count > 0;
  END IF;

  -- interaction se tiver lead
  IF p_lead_id IS NOT NULL THEN
    INSERT INTO public.interactions (workspace_id, lead_id, type, content, metadata)
    VALUES (
      v_ws_id, p_lead_id, 'ai_action',
      'Dorinda acionou: ' || p_tipo,
      jsonb_build_object(
        'source', 'dorinda',
        'subtipo', p_tipo,
        'urgencia', COALESCE(p_urgencia, 'media'),
        'notification_id', v_notification_id,
        'conversation_id', p_conversation_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok',                              true,
    'notification_id',                 v_notification_id,
    'conversation_switched_to_human',  v_switched
  );
END;
$$;


-- ============================================================================
-- 8. ÍNDICE FUNCIONAL pra suportar dedup de lead por telefone normalizado
-- ============================================================================
CREATE INDEX IF NOT EXISTS leads_phone_normalized_idx
  ON public.leads (workspace_id, (regexp_replace(phone, '[^0-9]', '', 'g')))
  WHERE deleted_at IS NULL;


-- ============================================================================
-- 9. GRANTS — anon e authenticated executam as RPCs
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.dorinda_consultar_imoveis(
  TEXT, TEXT, property_purpose, property_kind, INTEGER, INTEGER,
  NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, INTEGER
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.dorinda_consultar_imovel_por_id(TEXT)
  TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.dorinda_criar_lead(
  TEXT, TEXT, TEXT, property_purpose, UUID[], UUID, TEXT
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.dorinda_agendar_visita(
  UUID, TEXT, TEXT, TIMESTAMPTZ, INTEGER, UUID, TEXT
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.dorinda_notificar_corretor(
  TEXT, TEXT, TEXT, UUID, UUID, JSONB
) TO anon, authenticated;

-- helpers: só authenticated (anon não precisa chamar direto)
GRANT EXECUTE ON FUNCTION public.dorinda_default_workspace_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dorinda_owner_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dorinda_next_protocol_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dorinda_normalize_phone(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dorinda_format_ptbr(TIMESTAMPTZ) TO authenticated;
