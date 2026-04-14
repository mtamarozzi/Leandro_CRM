import { z } from 'zod';

// ============================================================================
// event-schema.ts — Validação de eventos da agenda
// ============================================================================

export const EVENT_TYPES = ['followup', 'visita', 'reuniao', 'tarefa', 'ligacao'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  followup: 'Follow-up',
  visita: 'Visita',
  reuniao: 'Reunião',
  tarefa: 'Tarefa',
  ligacao: 'Ligação',
};

export const EVENT_STATUSES = [
  'agendado',
  'confirmado',
  'realizado',
  'cancelado',
  'nao_compareceu',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  nao_compareceu: 'Não compareceu',
};

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalUuid = z.preprocess(
  emptyToUndefined,
  z.string().uuid('ID inválido').optional(),
);

// ---------------------------------------------------------------------------
// Schema de criação
// ---------------------------------------------------------------------------

export const eventCreateSchema = z
  .object({
    title: z.string().trim().min(2, 'Título muito curto').max(160),
    type: z.enum(EVENT_TYPES).default('followup'),
    status: z.enum(EVENT_STATUSES).default('agendado'),
    starts_at: z.string().datetime({ offset: true, message: 'Data/hora de início inválida' }),
    ends_at: z.preprocess(
      emptyToUndefined,
      z.string().datetime({ offset: true, message: 'Data/hora de fim inválida' }).optional(),
    ),
    description: optionalText(2000),
    location: optionalText(240),
    reminder_minutes_before: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().nonnegative().max(10080).optional(),
    ),
    lead_id: optionalUuid,
    property_id: optionalUuid,
  })
  .superRefine((data, ctx) => {
    if (data.ends_at && data.starts_at > data.ends_at) {
      ctx.addIssue({
        code: 'custom',
        path: ['ends_at'],
        message: 'O fim precisa ser depois do início',
      });
    }
  });

export type EventCreateInput = z.infer<typeof eventCreateSchema>;

// ---------------------------------------------------------------------------
// Schema de edição (campos opcionais)
// ---------------------------------------------------------------------------

export const eventUpdateSchema = eventCreateSchema
  .innerType()
  .partial()
  .superRefine((data, ctx) => {
    if (data.ends_at && data.starts_at && data.starts_at > data.ends_at) {
      ctx.addIssue({
        code: 'custom',
        path: ['ends_at'],
        message: 'O fim precisa ser depois do início',
      });
    }
  });

export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function nowPlusHours(hours: number): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export function makeEventFormDefaults(): EventCreateInput {
  return {
    title: '',
    type: 'followup',
    status: 'agendado',
    starts_at: nowPlusHours(1),
    ends_at: undefined,
    description: undefined,
    location: undefined,
    reminder_minutes_before: 30,
    lead_id: undefined,
    property_id: undefined,
  };
}

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

export interface EventListFilters {
  from?: string;
  to?: string;
  type?: EventType;
  status?: EventStatus;
}
