import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const workspaceUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome muito curto (mínimo 2 caracteres)')
    .max(100, 'Nome muito longo (máximo 100 caracteres)'),

  creci: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(20, 'CRECI muito longo (máximo 20 caracteres)')
      .optional(),
  ),

  phone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(20, 'Telefone muito longo (máximo 20 caracteres)')
      .optional(),
  ),

  primary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida (formato esperado: #RRGGBB)'),
});

export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;

export const DEFAULT_PRIMARY_COLOR = '#D4A017';

export const WORKSPACE_COLOR_PRESETS: Array<{ label: string; value: string }> = [
  { label: 'Dourado', value: '#D4A017' },
  { label: 'Grafite', value: '#3C3C3C' },
  { label: 'Cinza', value: '#808080' },
];
