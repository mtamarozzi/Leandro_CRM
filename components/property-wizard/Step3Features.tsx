import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import type { PropertyFullInput } from '@/src/lib/schemas/property-schema';

export function Step3Features() {
  const {
    register,
    formState: { errors },
  } = useFormContext<PropertyFullInput>();

  return (
    <div className="wizard-step">
      <header className="wizard-step__header">
        <h3 className="wizard-step__title">Características</h3>
        <p className="wizard-step__hint">
          Detalhes físicos do imóvel — tudo opcional menos a área se você quiser que apareça nos filtros.
        </p>
      </header>

      <div className="wizard-step__row">
        <div className="wizard-step__field">
          <label htmlFor="prop-area" className="wizard-step__label">
            Área útil (m²)
          </label>
          <Input
            id="prop-area"
            type="number"
            step="0.01"
            placeholder="Ex.: 87.5"
            {...register('usable_area_m2')}
          />
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-bedrooms" className="wizard-step__label">
            Dormitórios
          </label>
          <Input
            id="prop-bedrooms"
            type="number"
            min={0}
            {...register('bedrooms')}
          />
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-suites" className="wizard-step__label">
            Suítes
          </label>
          <Input id="prop-suites" type="number" min={0} {...register('suites')} />
        </div>
      </div>

      <div className="wizard-step__row">
        <div className="wizard-step__field">
          <label htmlFor="prop-baths" className="wizard-step__label">
            Banheiros
          </label>
          <Input
            id="prop-baths"
            type="number"
            min={0}
            {...register('bathrooms')}
          />
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-parking" className="wizard-step__label">
            Vagas de garagem
          </label>
          <Input
            id="prop-parking"
            type="number"
            min={0}
            {...register('parking_spots')}
          />
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-garage-type" className="wizard-step__label">
            Tipo de garagem
          </label>
          <Input
            id="prop-garage-type"
            placeholder="Ex.: Coberta, demarcada"
            {...register('garage_type')}
          />
        </div>
      </div>

      <div className="wizard-step__checks">
        <label className="wizard-step__check">
          <input type="checkbox" {...register('is_furnished')} />
          <span>Mobiliado</span>
        </label>
        <label className="wizard-step__check">
          <input type="checkbox" {...register('has_balcony')} />
          <span>Tem varanda</span>
        </label>
        <label className="wizard-step__check">
          <input type="checkbox" {...register('pet_friendly')} />
          <span>Aceita pets</span>
        </label>
      </div>

      {Object.keys(errors).length > 0 && (
        <p className="wizard-step__error">Confira os campos com valores inválidos.</p>
      )}
    </div>
  );
}
