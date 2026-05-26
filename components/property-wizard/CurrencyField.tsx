import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import type { PropertyFullInput } from '@/src/lib/schemas/property-schema';

/** Campos monetários do formulário de imóvel (valores inteiros em reais). */
type CurrencyFieldName =
  | 'sale_price'
  | 'rent_price'
  | 'condo_fee'
  | 'iptu'
  | 'total_monthly';

interface CurrencyFieldProps {
  id: string;
  name: CurrencyFieldName;
  placeholder?: string;
}

/**
 * Input com máscara monetária em pt-BR. Conta APENAS dígitos e guarda o valor
 * como inteiro em reais (ex.: digitar "420000" → exibe "420.000" → salva 420000).
 *
 * Resolve o bug do `<input type="number">`, em que digitar no formato BR
 * "420.000" era interpretado como decimal e salvava 420.
 */
export function CurrencyField({ id, name, placeholder }: CurrencyFieldProps) {
  const { control } = useFormContext<PropertyFullInput>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const display =
          field.value === undefined || field.value === null
            ? ''
            : Number(field.value).toLocaleString('pt-BR');

        return (
          <Input
            id={id}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            value={display}
            aria-invalid={fieldState.error ? 'true' : 'false'}
            onBlur={field.onBlur}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              field.onChange(digits === '' ? undefined : Number(digits));
            }}
          />
        );
      }}
    />
  );
}
