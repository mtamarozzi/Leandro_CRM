import { useFormContext, useWatch } from 'react-hook-form';
import { Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CurrencyField } from './CurrencyField';
import type { PropertyFullInput } from '@/src/lib/schemas/property-schema';

interface Step4ValuesPhotosProps {
  /** Slot opcional renderizado abaixo dos campos — usado para o PhotoUploader após o imóvel ser criado. */
  photosSlot?: React.ReactNode;
}

export function Step4ValuesPhotos({ photosSlot }: Step4ValuesPhotosProps) {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext<PropertyFullInput>();

  const purpose = useWatch({ control, name: 'purpose' });
  const showSale = purpose === 'venda' || purpose === 'lancamento';
  const showRent = purpose === 'locacao';

  return (
    <div className="wizard-step">
      <header className="wizard-step__header">
        <h3 className="wizard-step__title">Valores e descrição</h3>
        <p className="wizard-step__hint">
          Os campos visíveis dependem da finalidade escolhida no passo 1.
        </p>
      </header>

      <div className="wizard-step__row">
        {showSale && (
          <div className="wizard-step__field">
            <label htmlFor="prop-sale" className="wizard-step__label">
              Preço de venda (R$)
            </label>
            <CurrencyField id="prop-sale" name="sale_price" placeholder="Ex.: 750.000" />
            {errors.sale_price && (
              <span className="wizard-step__error">{errors.sale_price.message}</span>
            )}
          </div>
        )}

        {showRent && (
          <div className="wizard-step__field">
            <label htmlFor="prop-rent" className="wizard-step__label">
              Aluguel (R$)
            </label>
            <CurrencyField id="prop-rent" name="rent_price" placeholder="Ex.: 3.500" />
            {errors.rent_price && (
              <span className="wizard-step__error">{errors.rent_price.message}</span>
            )}
          </div>
        )}

        <div className="wizard-step__field">
          <label htmlFor="prop-condo" className="wizard-step__label">
            Condomínio (R$)
          </label>
          <CurrencyField id="prop-condo" name="condo_fee" placeholder="Ex.: 850" />
        </div>

        <div className="wizard-step__field">
          <label htmlFor="prop-iptu" className="wizard-step__label">
            IPTU (R$)
          </label>
          <CurrencyField id="prop-iptu" name="iptu" placeholder="Ex.: 320" />
        </div>
      </div>

      {showRent && (
        <div className="wizard-step__row">
          <div className="wizard-step__field">
            <label htmlFor="prop-monthly" className="wizard-step__label">
              Total mensal (R$)
            </label>
            <CurrencyField id="prop-monthly" name="total_monthly" placeholder="Aluguel + condomínio + IPTU" />
          </div>

          <div className="wizard-step__field">
            <label htmlFor="prop-guarantee" className="wizard-step__label">
              Garantia
            </label>
            <Input
              id="prop-guarantee"
              placeholder="Ex.: Fiador, caução, seguro-fiança"
              {...register('guarantee_type')}
            />
          </div>

          <div className="wizard-step__field">
            <label htmlFor="prop-contract" className="wizard-step__label">
              Tipo de contrato
            </label>
            <Input
              id="prop-contract"
              placeholder="Ex.: Residencial 30 meses"
              {...register('contract_type')}
            />
          </div>

          <div className="wizard-step__field">
            <label htmlFor="prop-min" className="wizard-step__label">
              Permanência mínima
            </label>
            <Input
              id="prop-min"
              placeholder="Ex.: 12 meses"
              {...register('min_contract')}
            />
          </div>

          <div className="wizard-step__field">
            <label htmlFor="prop-avail" className="wizard-step__label">
              Disponibilidade
            </label>
            <Input
              id="prop-avail"
              placeholder="Ex.: Imediata"
              {...register('availability')}
            />
          </div>
        </div>
      )}

      {showSale && (
        <div className="wizard-step__field">
          <label htmlFor="prop-payment" className="wizard-step__label">
            Condições de pagamento
          </label>
          <Input
            id="prop-payment"
            placeholder="Ex.: Financiamento aceito, FGTS"
            {...register('payment_conditions')}
          />
        </div>
      )}

      <div className="wizard-step__field">
        <label htmlFor="prop-highlights" className="wizard-step__label">
          Destaques (uso interno)
        </label>
        <textarea
          id="prop-highlights"
          rows={3}
          className="wizard-step__textarea"
          placeholder="Pontos fortes para a Dorinda usar nas conversas"
          {...register('highlights')}
        />
      </div>

      <div className="wizard-step__field">
        <label htmlFor="prop-public" className="wizard-step__label">
          Descrição pública
        </label>
        <textarea
          id="prop-public"
          rows={5}
          className="wizard-step__textarea"
          placeholder="Texto longo para exibir no catálogo público"
          {...register('public_description')}
        />
      </div>

      {photosSlot && (
        <section className="wizard-step__photos">
          <header className="wizard-step__header">
            <h4 className="wizard-step__title">Fotos</h4>
            <p className="wizard-step__hint">
              <Info size={12} aria-hidden="true" /> O upload é habilitado depois que o imóvel é salvo pela primeira vez.
            </p>
          </header>
          {photosSlot}
        </section>
      )}
    </div>
  );
}
