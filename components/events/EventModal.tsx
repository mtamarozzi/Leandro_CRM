import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogPortal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  eventCreateSchema,
  makeEventFormDefaults,
  type EventCreateInput,
} from '@/src/lib/schemas/event-schema';
import {
  useCreateEvent,
  useDeleteEvent,
  useEvent,
  useUpdateEvent,
} from '@/src/hooks/useEvents';
import { useLeads } from '@/src/hooks/useLeads';
import { useProperties } from '@/src/hooks/useProperties';

interface EventModalProps {
  open: boolean;
  eventId: string | null;
  onClose: () => void;
  defaultLeadId?: string;
  defaultPropertyId?: string;
}

function toDatetimeLocal(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function EventModal({
  open,
  eventId,
  onClose,
  defaultLeadId,
  defaultPropertyId,
}: EventModalProps) {
  const isEdit = eventId !== null;
  const eventQuery = useEvent(eventId ?? undefined);
  const leadsQuery = useLeads();
  const propertiesQuery = useProperties();

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventCreateInput>({
    resolver: zodResolver(eventCreateSchema),
    defaultValues: makeEventFormDefaults(),
  });

  useEffect(() => {
    if (!open) return;
    const defaults = makeEventFormDefaults();
    if (eventQuery.data) {
      reset({
        title: eventQuery.data.title,
        type: eventQuery.data.type,
        status: eventQuery.data.status,
        starts_at: eventQuery.data.starts_at,
        ends_at: eventQuery.data.ends_at ?? undefined,
        description: eventQuery.data.description ?? undefined,
        location: eventQuery.data.location ?? undefined,
        reminder_minutes_before: eventQuery.data.reminder_minutes_before ?? undefined,
        lead_id: eventQuery.data.lead_id ?? undefined,
        property_id: eventQuery.data.property_id ?? undefined,
      });
    } else {
      reset({
        ...defaults,
        lead_id: defaultLeadId ?? defaults.lead_id,
        property_id: defaultPropertyId ?? defaults.property_id,
      });
    }
  }, [open, eventQuery.data, reset, defaultLeadId, defaultPropertyId]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && eventId) {
        await updateMutation.mutateAsync({ id: eventId, patch: values });
        toast.success('Evento atualizado.');
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Evento criado.');
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar evento.';
      toast.error(message);
    }
  });

  const handleDelete = async () => {
    if (!eventId) return;
    const ok = window.confirm('Excluir este evento?');
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(eventId);
      toast.success('Evento excluído.');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir evento.';
      toast.error(message);
    }
  };

  const leadOptions = useMemo(
    () =>
      (leadsQuery.data ?? []).map((lead) => ({
        value: lead.id,
        label: `${lead.name} · ${lead.phone}`,
      })),
    [leadsQuery.data],
  );

  const propertyOptions = useMemo(
    () =>
      (propertiesQuery.data ?? []).map((p) => ({
        value: p.id,
        label: `${p.ref_code ?? 'sem código'} · ${p.neighborhood}`,
      })),
    [propertiesQuery.data],
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogPortal>
        <DialogContent className="event-modal lead-modal" showCloseButton={false}>
          <header className="lead-modal__header">
            <div>
              <h2 className="lead-modal__title">{isEdit ? 'Editar evento' : 'Novo evento'}</h2>
              <p className="lead-modal__subtitle">
                {isEdit
                  ? 'Ajuste dados, status ou vincule a um lead/imóvel.'
                  : 'Agende um follow-up, visita, reunião, tarefa ou ligação.'}
              </p>
            </div>
            <button type="button" className="lead-modal__close" onClick={onClose} aria-label="Fechar">
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <form className="lead-modal__body" onSubmit={onSubmit} noValidate>
            <div className="lead-modal__field">
              <label htmlFor="event-title" className="lead-modal__label">
                Título
              </label>
              <Input
                id="event-title"
                placeholder="Ex.: Visita no Vista Park às 10h"
                aria-invalid={errors.title ? 'true' : 'false'}
                {...register('title')}
              />
              {errors.title && (
                <span className="lead-modal__error">{errors.title.message}</span>
              )}
            </div>

            <div className="lead-modal__row">
              <div className="lead-modal__field">
                <label htmlFor="event-type" className="lead-modal__label">
                  Tipo
                </label>
                <select
                  id="event-type"
                  className="lead-modal__select"
                  {...register('type')}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {EVENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lead-modal__field">
                <label htmlFor="event-status" className="lead-modal__label">
                  Status
                </label>
                <select
                  id="event-status"
                  className="lead-modal__select"
                  {...register('status')}
                >
                  {EVENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {EVENT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lead-modal__field">
                <label htmlFor="event-reminder" className="lead-modal__label">
                  Lembrete (min antes)
                </label>
                <Input
                  id="event-reminder"
                  type="number"
                  min={0}
                  placeholder="30"
                  {...register('reminder_minutes_before')}
                />
              </div>
            </div>

            <div className="lead-modal__row">
              <div className="lead-modal__field">
                <label htmlFor="event-start" className="lead-modal__label">
                  Início
                </label>
                <Controller
                  control={control}
                  name="starts_at"
                  render={({ field }) => (
                    <Input
                      id="event-start"
                      type="datetime-local"
                      value={toDatetimeLocal(field.value)}
                      onChange={(e) => {
                        const iso = fromDatetimeLocal(e.target.value);
                        if (iso) field.onChange(iso);
                      }}
                    />
                  )}
                />
                {errors.starts_at && (
                  <span className="lead-modal__error">{errors.starts_at.message}</span>
                )}
              </div>

              <div className="lead-modal__field">
                <label htmlFor="event-end" className="lead-modal__label">
                  Fim (opcional)
                </label>
                <Controller
                  control={control}
                  name="ends_at"
                  render={({ field }) => (
                    <Input
                      id="event-end"
                      type="datetime-local"
                      value={toDatetimeLocal(field.value)}
                      onChange={(e) => {
                        const iso = fromDatetimeLocal(e.target.value);
                        field.onChange(iso);
                      }}
                    />
                  )}
                />
                {errors.ends_at && (
                  <span className="lead-modal__error">{errors.ends_at.message}</span>
                )}
              </div>
            </div>

            <div className="lead-modal__row">
              <div className="lead-modal__field">
                <label htmlFor="event-lead" className="lead-modal__label">
                  Lead vinculado (opcional)
                </label>
                <Controller
                  control={control}
                  name="lead_id"
                  render={({ field }) => (
                    <select
                      id="event-lead"
                      className="lead-modal__select"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? undefined : e.target.value)
                      }
                    >
                      <option value="">— nenhum —</option>
                      {leadOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div className="lead-modal__field">
                <label htmlFor="event-property" className="lead-modal__label">
                  Imóvel vinculado (opcional)
                </label>
                <Controller
                  control={control}
                  name="property_id"
                  render={({ field }) => (
                    <select
                      id="event-property"
                      className="lead-modal__select"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? undefined : e.target.value)
                      }
                    >
                      <option value="">— nenhum —</option>
                      {propertyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>

            <div className="lead-modal__field">
              <label htmlFor="event-location" className="lead-modal__label">
                Local (opcional)
              </label>
              <Input
                id="event-location"
                placeholder="Endereço, sala de reunião, link…"
                {...register('location')}
              />
            </div>

            <div className="lead-modal__field">
              <label htmlFor="event-desc" className="lead-modal__label">
                Descrição / notas
              </label>
              <textarea
                id="event-desc"
                rows={3}
                className="lead-modal__textarea"
                placeholder="Pauta, o que preparar, contexto…"
                {...register('description')}
              />
            </div>

            <footer className="lead-modal__footer">
              {isEdit && (
                <button
                  type="button"
                  className="lead-modal__btn lead-modal__btn--ghost"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  style={{ marginRight: 'auto', color: 'var(--destructive)' }}
                >
                  <Trash2 size={16} aria-hidden="true" /> Excluir
                </button>
              )}
              <button
                type="button"
                className="lead-modal__btn lead-modal__btn--ghost"
                onClick={onClose}
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="lead-modal__btn lead-modal__btn--primary"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Salvando…
                  </>
                ) : (
                  <>
                    <Check size={16} aria-hidden="true" /> {isEdit ? 'Salvar' : 'Criar evento'}
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
