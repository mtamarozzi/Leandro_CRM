import { z } from 'zod';

// ============================================================================
// interaction-schema.ts — Validação das interações registradas em `interactions`
// ============================================================================
// Tipos criados manualmente pelo Leandro: whatsapp, call, email, visit, meeting, note.
// Tipos criados automaticamente pelo sistema: status_change, ai_action.
// ============================================================================

export const INTERACTION_TYPES = [
  'whatsapp',
  'call',
  'email',
  'visit',
  'meeting',
  'note',
  'status_change',
  'ai_action',
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  visit: 'Visita',
  meeting: 'Reunião',
  note: 'Anotação',
  status_change: 'Mudança de status',
  ai_action: 'Ação da IA',
};

/** Tipos que o Leandro pode criar manualmente pelo LeadDetailModal. */
export const MANUAL_INTERACTION_TYPES: readonly InteractionType[] = [
  'note',
  'whatsapp',
  'call',
  'email',
  'meeting',
  'visit',
] as const;

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

// ---------------------------------------------------------------------------
// Schema de criação manual de interação
// ---------------------------------------------------------------------------

export const interactionCreateSchema = z.object({
  lead_id: z.string().uuid('ID do lead inválido'),
  type: z.enum(MANUAL_INTERACTION_TYPES as [InteractionType, ...InteractionType[]], {
    message: 'Tipo inválido para criação manual',
  }),
  content: z
    .string()
    .trim()
    .min(1, 'Conteúdo obrigatório')
    .max(4000, 'Conteúdo muito longo'),
  occurred_at: z.preprocess(
    emptyToUndefined,
    z.string().datetime({ offset: true }).optional(),
  ),
});

export type InteractionCreateInput = z.infer<typeof interactionCreateSchema>;

export const INTERACTION_FORM_DEFAULTS: InteractionCreateInput = {
  lead_id: '',
  type: 'note',
  content: '',
  occurred_at: undefined,
};
