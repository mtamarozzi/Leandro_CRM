import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import type { PropertyFullInput } from '@/src/lib/schemas/property-schema';

export function Step2Location() {
  const {
    register,
    formState: { errors },
  } = useFormContext<PropertyFullInput>();

  return (
    <div className="wizard-step">
      <header className="wizard-step__header">
        <h3 className="wizard-step__title">Localização</h3>
        <p className="wizard-step__hint">
          Cidade e bairro são obrigatórios. Coordenadas são opcionais.
        </p>
      </header>

      <div className="wizard-step__row">
        <div className="wizard-step__field">
          <label htmlFor="prop-city" className="wizard-step__label">
            Cidade
          </label>
          <Input
            id="prop-city"
            placeholder="Ex.: Santos"
            aria-invalid={errors.city ? 'true' : 'false'}
            {...register('city')}
          />
          {errors.city && (
            <span className="wizard-step__error">{errors.city.message}</span>
          )}
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-neighborhood" className="wizard-step__label">
            Bairro
          </label>
          <Input
            id="prop-neighborhood"
            placeholder="Ex.: Gonzaga"
            aria-invalid={errors.neighborhood ? 'true' : 'false'}
            {...register('neighborhood')}
          />
          {errors.neighborhood && (
            <span className="wizard-step__error">{errors.neighborhood.message}</span>
          )}
        </div>
      </div>

      <div className="wizard-step__field">
        <label htmlFor="prop-address" className="wizard-step__label">
          Endereço completo
        </label>
        <Input
          id="prop-address"
          placeholder="Rua, número, complemento"
          {...register('full_address')}
        />
      </div>

      <div className="wizard-step__row">
        <div className="wizard-step__field">
          <label htmlFor="prop-floor" className="wizard-step__label">
            Andar
          </label>
          <Input
            id="prop-floor"
            placeholder='Ex.: 12, "Sobreposta"'
            {...register('floor')}
          />
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-lat" className="wizard-step__label">
            Latitude (opcional)
          </label>
          <Input
            id="prop-lat"
            type="number"
            step="0.0000001"
            placeholder="-23.9618"
            {...register('latitude')}
          />
          {errors.latitude && (
            <span className="wizard-step__error">{errors.latitude.message}</span>
          )}
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-lng" className="wizard-step__label">
            Longitude (opcional)
          </label>
          <Input
            id="prop-lng"
            type="number"
            step="0.0000001"
            placeholder="-46.3322"
            {...register('longitude')}
          />
          {errors.longitude && (
            <span className="wizard-step__error">{errors.longitude.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
