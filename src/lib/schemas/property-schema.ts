import { z } from 'zod';

// ============================================================================
// property-schema.ts — Validação dos formulários de imóveis (wizard 4 etapas)
// ============================================================================
// Schema completo + 4 schemas progressivos (um por etapa do wizard).
// Cada etapa pode ser validada isoladamente antes de avançar pro próximo step.
//
// `ref_code` é gerado server-side via RPC `generate_property_ref_code` —
// não aparece no payload de create.
// ============================================================================

// ---------------------------------------------------------------------------
// Constantes de ENUM (espelham os types do banco — `src/types/database.ts`)
// ---------------------------------------------------------------------------

export const PROPERTY_PURPOSES = ['venda', 'locacao', 'lancamento'] as const;
export type PropertyPurpose = (typeof PROPERTY_PURPOSES)[number];

export const PROPERTY_KINDS = [
  'apartamento',
  'casa',
  'cobertura',
  'studio',
  'sobrado',
  'terreno',
  'comercial',
  'sala_comercial',
  'galpao',
  'chacara',
  'outro',
] as const;
export type PropertyKind = (typeof PROPERTY_KINDS)[number];

export const PROPERTY_STATUSES = [
  'disponivel',
  'reservado',
  'alugado',
  'vendido',
  'indisponivel',
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

// ---------------------------------------------------------------------------
// Labels amigáveis em pt-BR (para selects e badges)
// ---------------------------------------------------------------------------

export const PROPERTY_PURPOSE_LABELS: Record<PropertyPurpose, string> = {
  venda: 'Venda',
  locacao: 'Locação',
  lancamento: 'Lançamento',
};

export const PROPERTY_KIND_LABELS: Record<PropertyKind, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  cobertura: 'Cobertura',
  studio: 'Studio',
  sobrado: 'Sobrado',
  terreno: 'Terreno',
  comercial: 'Comercial',
  sala_comercial: 'Sala comercial',
  galpao: 'Galpão',
  chacara: 'Chácara',
  outro: 'Outro',
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  alugado: 'Alugado',
  vendido: 'Vendido',
  indisponivel: 'Indisponível',
};

// ---------------------------------------------------------------------------
// Helpers de transformação
// ---------------------------------------------------------------------------

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

/** Aceita number ou string vazia; converte vazio em undefined. */
const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().nonnegative().optional(),
);

const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max).optional(),
  );

// ---------------------------------------------------------------------------
// Etapa 1 — Identificação (purpose, kind, status, lançamento)
// ---------------------------------------------------------------------------

export const propertyStep1Schema = z
  .object({
    purpose: z.enum(PROPERTY_PURPOSES, { message: 'Selecione a finalidade' }),
    kind: z.enum(PROPERTY_KINDS, { message: 'Selecione a categoria' }),
    status: z.enum(PROPERTY_STATUSES).default('disponivel'),
    development_name: optionalText(120),
    developer: optionalText(120),
    is_featured: z.boolean().default(false),
    is_public: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.purpose === 'lancamento') {
      if (!data.development_name) {
        ctx.addIssue({
          code: 'custom',
          path: ['development_name'],
          message: 'Lançamentos exigem o nome do empreendimento',
        });
      }
      if (!data.developer) {
        ctx.addIssue({
          code: 'custom',
          path: ['developer'],
          message: 'Lançamentos exigem a construtora',
        });
      }
    }
  });

export type PropertyStep1Input = z.infer<typeof propertyStep1Schema>;

// ---------------------------------------------------------------------------
// Etapa 2 — Localização
// ---------------------------------------------------------------------------

export const propertyStep2Schema = z.object({
  city: z.string().trim().min(2, 'Cidade obrigatória').max(80),
  neighborhood: z.string().trim().min(2, 'Bairro obrigatório').max(80),
  full_address: optionalText(240),
  floor: optionalText(20),
  latitude: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(-90).max(90).optional(),
  ),
  longitude: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(-180).max(180).optional(),
  ),
});

export type PropertyStep2Input = z.infer<typeof propertyStep2Schema>;

// ---------------------------------------------------------------------------
// Etapa 3 — Características físicas
// ---------------------------------------------------------------------------

export const propertyStep3Schema = z.object({
  usable_area_m2: optionalNumber,
  bedrooms: z.coerce.number().int().nonnegative().default(0),
  suites: z.coerce.number().int().nonnegative().default(0),
  bathrooms: z.coerce.number().int().nonnegative().default(0),
  parking_spots: z.coerce.number().int().nonnegative().default(0),
  garage_type: optionalText(60),
  is_furnished: z.boolean().default(false),
  has_balcony: z.boolean().default(false),
  pet_friendly: z.boolean().default(false),
});

export type PropertyStep3Input = z.infer<typeof propertyStep3Schema>;

// ---------------------------------------------------------------------------
// Etapa 4 — Valores, descrições e contrato (fotos são separadas no upload)
// ---------------------------------------------------------------------------

export const propertyStep4Schema = z
  .object({
    sale_price: optionalNumber,
    rent_price: optionalNumber,
    condo_fee: optionalNumber,
    iptu: optionalNumber,
    total_monthly: optionalNumber,
    guarantee_type: optionalText(60),
    contract_type: optionalText(60),
    min_contract: optionalText(60),
    availability: optionalText(60),
    payment_conditions: optionalText(240),
    highlights: optionalText(2000),
    public_description: optionalText(4000),
  })
  .superRefine((data, ctx) => {
    // Validação contextual feita na união completa abaixo
    void data;
    void ctx;
  });

export type PropertyStep4Input = z.infer<typeof propertyStep4Schema>;

// ---------------------------------------------------------------------------
// Schema completo (junção dos 4 steps + validação cruzada)
// ---------------------------------------------------------------------------

const baseShape = z.object({
  // Step 1
  purpose: z.enum(PROPERTY_PURPOSES, { message: 'Selecione a finalidade' }),
  kind: z.enum(PROPERTY_KINDS, { message: 'Selecione a categoria' }),
  status: z.enum(PROPERTY_STATUSES).default('disponivel'),
  development_name: optionalText(120),
  developer: optionalText(120),
  is_featured: z.boolean().default(false),
  is_public: z.boolean().default(true),
  // Step 2
  city: z.string().trim().min(2, 'Cidade obrigatória').max(80),
  neighborhood: z.string().trim().min(2, 'Bairro obrigatório').max(80),
  full_address: optionalText(240),
  floor: optionalText(20),
  latitude: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(-90).max(90).optional(),
  ),
  longitude: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(-180).max(180).optional(),
  ),
  // Step 3
  usable_area_m2: optionalNumber,
  bedrooms: z.coerce.number().int().nonnegative().default(0),
  suites: z.coerce.number().int().nonnegative().default(0),
  bathrooms: z.coerce.number().int().nonnegative().default(0),
  parking_spots: z.coerce.number().int().nonnegative().default(0),
  garage_type: optionalText(60),
  is_furnished: z.boolean().default(false),
  has_balcony: z.boolean().default(false),
  pet_friendly: z.boolean().default(false),
  // Step 4
  sale_price: optionalNumber,
  rent_price: optionalNumber,
  condo_fee: optionalNumber,
  iptu: optionalNumber,
  total_monthly: optionalNumber,
  guarantee_type: optionalText(60),
  contract_type: optionalText(60),
  min_contract: optionalText(60),
  availability: optionalText(60),
  payment_conditions: optionalText(240),
  highlights: optionalText(2000),
  public_description: optionalText(4000),
});

export const propertyFullSchema = baseShape.superRefine((data, ctx) => {
  // Validações condicionais por purpose
  if (data.purpose === 'lancamento') {
    if (!data.development_name) {
      ctx.addIssue({
        code: 'custom',
        path: ['development_name'],
        message: 'Lançamentos exigem o nome do empreendimento',
      });
    }
    if (!data.developer) {
      ctx.addIssue({
        code: 'custom',
        path: ['developer'],
        message: 'Lançamentos exigem a construtora',
      });
    }
  }
  if (data.purpose === 'venda' || data.purpose === 'lancamento') {
    if (data.sale_price === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['sale_price'],
        message: 'Informe o preço de venda',
      });
    }
  }
  if (data.purpose === 'locacao') {
    if (data.rent_price === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['rent_price'],
        message: 'Informe o valor do aluguel',
      });
    }
  }
});

export type PropertyFullInput = z.infer<typeof propertyFullSchema>;

// ---------------------------------------------------------------------------
// Defaults para inicializar o formulário do wizard
// ---------------------------------------------------------------------------

export const PROPERTY_FORM_DEFAULTS: PropertyFullInput = {
  purpose: 'venda',
  kind: 'apartamento',
  status: 'disponivel',
  development_name: undefined,
  developer: undefined,
  is_featured: false,
  is_public: true,

  city: '',
  neighborhood: '',
  full_address: undefined,
  floor: undefined,
  latitude: undefined,
  longitude: undefined,

  usable_area_m2: undefined,
  bedrooms: 0,
  suites: 0,
  bathrooms: 0,
  parking_spots: 0,
  garage_type: undefined,
  is_furnished: false,
  has_balcony: false,
  pet_friendly: false,

  sale_price: undefined,
  rent_price: undefined,
  condo_fee: undefined,
  iptu: undefined,
  total_monthly: undefined,
  guarantee_type: undefined,
  contract_type: undefined,
  min_contract: undefined,
  availability: undefined,
  payment_conditions: undefined,
  highlights: undefined,
  public_description: undefined,
};

// ---------------------------------------------------------------------------
// Filtros da listagem (chips)
// ---------------------------------------------------------------------------

export interface PropertyListFilters {
  purpose?: PropertyPurpose;
  status?: PropertyStatus;
  kind?: PropertyKind;
  city?: string;
  neighborhood?: string;
  search?: string;
  isFeatured?: boolean;
}
