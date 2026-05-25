import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogPortal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  LEAD_FORM_DEFAULTS,
  LEAD_ORIGINS,
  LEAD_ORIGIN_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  leadCreateSchema,
  type LeadCreateInput,
} from '@/src/lib/schemas/lead-schema';
import {
  PROPERTY_PURPOSES,
  PROPERTY_PURPOSE_LABELS,
} from '@/src/lib/schemas/property-schema';
import { useCreateLead } from '@/src/hooks/useLeads';

interface NewLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (leadId: string) => void;
}

export function NewLeadModal({ open, onClose, onCreated }: NewLeadModalProps) {
  const createMutation = useCreateLead();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<LeadCreateInput>({
    resolver: zodResolver(leadCreateSchema),
    defaultValues: LEAD_FORM_DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(LEAD_FORM_DEFAULTS);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync(values);
      toast.success(`Lead ${created.name} cadastrado.`);
      onCreated?.(created.id);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar lead.';
      toast.error(message);
    }
  });

  const handleClose = () => {
    if (isDirty) {
      const ok = window.confirm('Descartar as alterações e fechar?');
      if (!ok) return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : handleClose())}>
      <DialogPortal>
        <DialogContent className="lead-modal" showCloseButton={false}>
          <header className="lead-modal__header">
            <div>
              <h2 className="lead-modal__title">Novo lead</h2>
              <p className="lead-modal__subtitle">
                Registre um contato manualmente — a Dorinda preenche o resto depois.
              </p>
            </div>
            <button
              type="button"
              className="lead-modal__close"
              onClick={handleClose}
              aria-label="Fechar"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <form className="lead-modal__body" onSubmit={onSubmit} noValidate>
            <div className="lead-modal__row">
              <div className="lead-modal__field">
                <label htmlFor="lead-name" className="lead-modal__label">
                  Nome completo
                </label>
                <Input
                  id="lead-name"
                  placeholder="Ex.: João da Silva"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  {...register('name')}
                />
                {errors.name && (
                  <span className="lead-modal__error">{errors.name.message}</span>
                )}
              </div>

              <div className="lead-modal__field">
                <label htmlFor="lead-phone" className="lead-modal__label">
                  WhatsApp / telefone
                </label>
                <Input
                  id="lead-phone"
                  placeholder="(13) 9 9999-0000"
                  aria-invalid={errors.phone ? 'true' : 'false'}
                  {...register('phone')}
                />
                {errors.phone && (
                  <span className="lead-modal__error">{errors.phone.message}</span>
                )}
              </div>
            </div>

            <div className="lead-modal__row">
              <div className="lead-modal__field">
                <label htmlFor="lead-email" className="lead-modal__label">
                  Email (opcional)
                </label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="joao@email.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  {...register('email')}
                />
                {errors.email && (
                  <span className="lead-modal__error">{errors.email.message}</span>
                )}
              </div>

              <div className="lead-modal__field">
                <label htmlFor="lead-origin" className="lead-modal__label">
                  Origem
                </label>
                <select
                  id="lead-origin"
                  className="lead-modal__select"
                  {...register('origin')}
                >
                  {LEAD_ORIGINS.map((o) => (
                    <option key={o} value={o}>
                      {LEAD_ORIGIN_LABELS[o]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lead-modal__field">
                <label htmlFor="lead-status" className="lead-modal__label">
                  Status inicial
                </label>
                <select
                  id="lead-status"
                  className="lead-modal__select"
                  {...register('status')}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lead-modal__row">
              <div className="lead-modal__field">
                <label htmlFor="lead-purpose" className="lead-modal__label">
                  Interesse em
                </label>
                <Controller
                  control={control}
                  name="interest_purpose"
                  render={({ field }) => (
                    <select
                      id="lead-purpose"
                      className="lead-modal__select"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? undefined : e.target.value)
                      }
                    >
                      <option value="">— indefinido —</option>
                      {PROPERTY_PURPOSES.map((p) => (
                        <option key={p} value={p}>
                          {PROPERTY_PURPOSE_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div className="lead-modal__field">
                <label htmlFor="lead-interest-type" className="lead-modal__label">
                  Tipo de imóvel
                </label>
                <Input
                  id="lead-interest-type"
                  placeholder="Ex.: Apartamento 2 dorms"
                  {...register('interest_type')}
                />
              </div>
            </div>

            <div className="lead-modal__row">
              <div className="lead-modal__field">
                <label htmlFor="lead-city" className="lead-modal__label">
                  Cidade preferida
                </label>
                <Input
                  id="lead-city"
                  placeholder="Ex.: Santos"
                  {...register('preferred_city')}
                />
              </div>

              <div className="lead-modal__field">
                <label htmlFor="lead-region" className="lead-modal__label">
                  Região / bairro
                </label>
                <Input
                  id="lead-region"
                  placeholder="Ex.: Gonzaga"
                  {...register('preferred_region')}
                />
              </div>
            </div>

            <div className="lead-modal__row">
              <div className="lead-modal__field">
                <label htmlFor="lead-min" className="lead-modal__label">
                  Orçamento mínimo (R$)
                </label>
                <Input
                  id="lead-min"
                  type="number"
                  step="0.01"
                  placeholder="Ex.: 300000"
                  {...register('budget_min')}
                />
              </div>

              <div className="lead-modal__field">
                <label htmlFor="lead-max" className="lead-modal__label">
                  Orçamento máximo (R$)
                </label>
                <Input
                  id="lead-max"
                  type="number"
                  step="0.01"
                  placeholder="Ex.: 450000"
                  aria-invalid={errors.budget_max ? 'true' : 'false'}
                  {...register('budget_max')}
                />
                {errors.budget_max && (
                  <span className="lead-modal__error">{errors.budget_max.message}</span>
                )}
              </div>
            </div>

            <div className="lead-modal__field">
              <label htmlFor="lead-notes" className="lead-modal__label">
                Observações
              </label>
              <textarea
                id="lead-notes"
                rows={3}
                className="lead-modal__textarea"
                placeholder="Contexto, urgência, indicação…"
                {...register('notes')}
              />
            </div>

            <footer className="lead-modal__footer">
              <button
                type="button"
                className="lead-modal__btn lead-modal__btn--ghost"
                onClick={handleClose}
                disabled={isSubmitting || createMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="lead-modal__btn lead-modal__btn--primary"
                disabled={isSubmitting || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Salvando…
                  </>
                ) : (
                  <>
                    <Check size={16} aria-hidden="true" /> Cadastrar lead
                  </>
                )}
              </button>
            </footer>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
