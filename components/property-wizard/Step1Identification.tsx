import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  PROPERTY_KINDS,
  PROPERTY_KIND_LABELS,
  PROPERTY_PURPOSES,
  PROPERTY_PURPOSE_LABELS,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABELS,
  type PropertyFullInput,
} from '@/src/lib/schemas/property-schema';

export function Step1Identification() {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext<PropertyFullInput>();

  const purpose = useWatch({ control, name: 'purpose' });
  const isLancamento = purpose === 'lancamento';

  return (
    <div className="wizard-step">
      <header className="wizard-step__header">
        <h3 className="wizard-step__title">Identificação</h3>
        <p className="wizard-step__hint">
          Defina a finalidade, categoria e situação do imóvel.
        </p>
      </header>

      <div className="wizard-step__row">
        <div className="wizard-step__field">
          <label htmlFor="prop-purpose" className="wizard-step__label">
            Finalidade
          </label>
          <select id="prop-purpose" className="wizard-step__select" {...register('purpose')}>
            {PROPERTY_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {PROPERTY_PURPOSE_LABELS[p]}
              </option>
            ))}
          </select>
          {errors.purpose && (
            <span className="wizard-step__error">{errors.purpose.message}</span>
          )}
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-kind" className="wizard-step__label">
            Categoria
          </label>
          <select id="prop-kind" className="wizard-step__select" {...register('kind')}>
            {PROPERTY_KINDS.map((k) => (
              <option key={k} value={k}>
                {PROPERTY_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          {errors.kind && (
            <span className="wizard-step__error">{errors.kind.message}</span>
          )}
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-status" className="wizard-step__label">
            Situação
          </label>
          <select id="prop-status" className="wizard-step__select" {...register('status')}>
            {PROPERTY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROPERTY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLancamento && (
        <div className="wizard-step__row">
          <div className="wizard-step__field">
            <label htmlFor="prop-development" className="wizard-step__label">
              Nome do empreendimento
            </label>
            <Input
              id="prop-development"
              placeholder="Ex.: Vista Park Residence"
              aria-invalid={errors.development_name ? 'true' : 'false'}
              {...register('development_name')}
            />
            {errors.development_name && (
              <span className="wizard-step__error">{errors.development_name.message}</span>
            )}
          </div>

          <div className="wizard-step__field">
            <label htmlFor="prop-developer" className="wizard-step__label">
              Construtora
            </label>
            <Input
              id="prop-developer"
              placeholder="Ex.: Construtora Excellence"
              aria-invalid={errors.developer ? 'true' : 'false'}
              {...register('developer')}
            />
            {errors.developer && (
              <span className="wizard-step__error">{errors.developer.message}</span>
            )}
          </div>
        </div>
      )}

      <div className="wizard-step__checks">
        <label className="wizard-step__check">
          <input type="checkbox" {...register('is_featured')} />
          <span>Marcar como destaque</span>
        </label>
        <label className="wizard-step__check">
          <input type="checkbox" {...register('is_public')} />
          <span>Visível no catálogo público</span>
        </label>
      </div>
    </div>
  );
}
