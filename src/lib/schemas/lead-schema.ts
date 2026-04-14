import { z } from 'zod';
import { PROPERTY_PURPOSES, type PropertyPurpose } from './property-schema';

// ============================================================================
// lead-schema.ts — Validação de leads (form + filtros)
// ============================================================================

export const LEAD_STATUSES = [
  'novo',
  'contato',
  'visita',
  'proposta',
  'ganho',
  'perdido',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo',
  contato: 'Em contato',
  visita: 'Visita agendada',
  proposta: 'Proposta',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

export const LEAD_ORIGINS = [
  'chat_widget',
  'whatsapp',
  'facebook',
  'instagram',
  'google',
  'indicacao',
  'site',
  'trafego_pago',
  'manual',
  'outro',
] as const;
export type LeadOrigin = (typeof LEAD_ORIGINS)[number];

export const LEAD_ORIGIN_LABELS: Record<LeadOrigin, string> = {
  chat_widget: 'Chat widget',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  google: 'Google',
  indicacao: 'Indicação',
  site: 'Site',
  trafego_pago: 'Tráfego pago',
  manual: 'Cadastro manual',
  outro: 'Outro',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().nonnegative().optional(),
);

const phoneSchema = z
  .string()
  .trim()
  .min(8, 'Telefone muito curto')
  .max(30, 'Telefone muito longo')
  .regex(/^[0-9+()\-\s]+$/, 'Telefone contém caracteres inválidos');

const emailSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().email('Email inválido').max(120).optional(),
);

const interestPurposeSchema = z.preprocess(
  emptyToUndefined,
  z.enum(PROPERTY_PURPOSES).optional(),
);

// ---------------------------------------------------------------------------
// Schema de criação (form de Novo Lead — todos os campos disponíveis)
// ---------------------------------------------------------------------------

export const leadCreateSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome muito curto').max(120),
    phone: phoneSchema,
    email: emailSchema,
    origin: z.enum(LEAD_ORIGINS).default('manual'),
    status: z.enum(LEAD_STATUSES).default('novo'),
    interest_purpose: interestPurposeSchema,
    interest_type: optionalText(120),
    preferred_city: optionalText(80),
    preferred_region: optionalText(80),
    budget_min: optionalNumber,
    budget_max: optionalNumber,
    notes: optionalText(2000),
  })
  .superRefine((data, ctx) => {
    if (
      data.budget_min !== undefined &&
      data.budget_max !== undefined &&
      data.budget_min > data.budget_max
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['budget_max'],
        message: 'Valor máximo precisa ser maior que o mínimo',
      });
    }
  });

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

// ---------------------------------------------------------------------------
// Schema de edição (todos opcionais — patch parcial)
// ---------------------------------------------------------------------------

export const leadUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: phoneSchema.optional(),
    email: emailSchema,
    origin: z.enum(LEAD_ORIGINS).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    interest_purpose: interestPurposeSchema,
    interest_type: optionalText(120),
    preferred_city: optionalText(80),
    preferred_region: optionalText(80),
    budget_min: optionalNumber,
    budget_max: optionalNumber,
    notes: optionalText(2000),
    assigned_to: optionalText(80),
  })
  .superRefine((data, ctx) => {
    if (
      data.budget_min !== undefined &&
      data.budget_max !== undefined &&
      data.budget_min > data.budget_max
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['budget_max'],
        message: 'Valor máximo precisa ser maior que o mínimo',
      });
    }
  });

export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

// ---------------------------------------------------------------------------
// Defaults para o form de Novo Lead
// ---------------------------------------------------------------------------

export const LEAD_FORM_DEFAULTS: LeadCreateInput = {
  name: '',
  phone: '',
  email: undefined,
  origin: 'manual',
  status: 'novo',
  interest_purpose: undefined,
  interest_type: undefined,
  preferred_city: undefined,
  preferred_region: undefined,
  budget_min: undefined,
  budget_max: undefined,
  notes: undefined,
};

// ---------------------------------------------------------------------------
// Filtros da listagem
// ---------------------------------------------------------------------------

export interface LeadListFilters {
  status?: LeadStatus;
  origin?: LeadOrigin;
  interest_purpose?: PropertyPurpose;
  preferred_region?: string;
  search?: string;
}
