import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  Check,
  Loader2,
  MessageSquare,
  Pencil,
  Phone as PhoneIcon,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogPortal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  LEAD_ORIGINS,
  LEAD_ORIGIN_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  leadUpdateSchema,
  type LeadUpdateInput,
} from '@/src/lib/schemas/lead-schema';
import {
  PROPERTY_PURPOSES,
  PROPERTY_PURPOSE_LABELS,
} from '@/src/lib/schemas/property-schema';
import {
  INTERACTION_TYPE_LABELS,
  MANUAL_INTERACTION_TYPES,
  interactionCreateSchema,
  type InteractionCreateInput,
} from '@/src/lib/schemas/interaction-schema';
import {
  useAddInteraction,
  useDeleteLead,
  useLead,
  useLeadInteractions,
  useUpdateLead,
} from '@/src/hooks/useLeads';

interface LeadDetailModalProps {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
}

type Mode = 'view' | 'edit';

export function LeadDetailModal({ open, leadId, onClose }: LeadDetailModalProps) {
  const leadQuery = useLead(leadId ?? undefined);
  const interactionsQuery = useLeadInteractions(leadId ?? undefined);
  const updateMutation = useUpdateLead();
  const deleteMutation = useDeleteLead();
  const addInteractionMutation = useAddInteraction();

  const lead = leadQuery.data;
  const [mode, setMode] = useState<Mode>('view');

  const editForm = useForm<LeadUpdateInput>({
    resolver: zodResolver(leadUpdateSchema),
    defaultValues: {},
  });

  const interactionForm = useForm<InteractionCreateInput>({
    resolver: zodResolver(interactionCreateSchema),
    defaultValues: { lead_id: leadId ?? '', type: 'note', content: '' },
  });

  useEffect(() => {
    if (!open) {
      setMode('view');
    }
  }, [open]);

  useEffect(() => {
    if (lead) {
      editForm.reset({
        name: lead.name,
        phone: lead.phone,
        email: lead.email ?? '',
        origin: lead.origin,
        status: lead.status,
        interest_purpose: lead.interest_purpose ?? undefined,
        interest_type: lead.interest_type ?? '',
        preferred_city: lead.preferred_city ?? '',
        preferred_region: lead.preferred_region ?? '',
        budget_min: lead.budget_min ?? undefined,
        budget_max: lead.budget_max ?? undefined,
        notes: lead.notes ?? '',
      });
      interactionForm.setValue('lead_id', lead.id);
    }
  }, [lead, editForm, interactionForm]);

  const onSubmitEdit = editForm.handleSubmit(async (values) => {
    if (!lead) return;
    try {
      await updateMutation.mutateAsync({ id: lead.id, patch: values });
      toast.success('Lead atualizado.');
      setMode('view');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar lead.';
      toast.error(message);
    }
  });

  const onSubmitInteraction = interactionForm.handleSubmit(async (values) => {
    try {
      await addInteractionMutation.mutateAsync(values);
      toast.success(`${INTERACTION_TYPE_LABELS[values.type]} registrada.`);
      interactionForm.reset({ lead_id: values.lead_id, type: 'note', content: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar interação.';
      toast.error(message);
    }
  });

  const handleDelete = async () => {
    if (!lead) return;
    const ok = window.confirm(`Arquivar o lead "${lead.name}"? Ele sai da lista mas fica no banco.`);
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(lead.id);
      toast.success('Lead arquivado.');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao arquivar lead.';
      toast.error(message);
    }
  };

  const interactions = interactionsQuery.data ?? [];

  const formattedInteractions = useMemo(
    () =>
      interactions.map((i) => ({
        ...i,
        displayDate: new Date(i.occurred_at).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
    [interactions],
  );

  if (!open || !leadId) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogPortal>
        <DialogContent className="lead-detail" showCloseButton={false}>
          <header className="lead-detail__header">
            <div>
              <h2 className="lead-detail__title">
                {lead?.name ?? (leadQuery.isLoading ? 'Carregando…' : 'Lead')}
              </h2>
              {lead && (
                <p className="lead-detail__subtitle">
                  <PhoneIcon size={12} aria-hidden="true" /> {lead.phone} · {LEAD_ORIGIN_LABELS[lead.origin]}
                </p>
              )}
            </div>
            <div className="lead-detail__actions">
              {mode === 'view' && lead && (
                <>
                  <button
                    type="button"
                    className="lead-detail__icon-btn"
                    onClick={() => setMode('edit')}
                    title="Editar"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="lead-detail__icon-btn lead-detail__icon-btn--danger"
                    onClick={handleDelete}
                    title="Arquivar"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </>
              )}
              <button
                type="button"
                className="lead-detail__close"
                onClick={onClose}
                aria-label="Fechar"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </header>

          {leadQuery.isError && (
            <p className="lead-detail__error">
              Erro ao carregar: {(leadQuery.error as Error).message}
            </p>
          )}

          {lead && (
            <div className="lead-detail__body">
              <section className="lead-detail__section">
                <h3 className="lead-detail__section-title">Dados</h3>

                {mode === 'view' && (
                  <dl className="lead-detail__data">
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <span className={`tag tag--${lead.status}`}>
                          {LEAD_STATUS_LABELS[lead.status]}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{lead.email ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Interesse</dt>
                      <dd>
                        {lead.interest_purpose
                          ? PROPERTY_PURPOSE_LABELS[lead.interest_purpose]
                          : '—'}
                        {lead.interest_type ? ` · ${lead.interest_type}` : ''}
                      </dd>
                    </div>
                    <div>
                      <dt>Região preferida</dt>
                      <dd>
                        {[lead.preferred_city, lead.preferred_region]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt>Orçamento</dt>
                      <dd>
                        {lead.budget_min || lead.budget_max
                          ? `${formatCurrency(lead.budget_min)} – ${formatCurrency(lead.budget_max)}`
                          : '—'}
                      </dd>
                    </div>
                    {lead.notes && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <dt>Observações</dt>
                        <dd style={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {mode === 'edit' && (
                  <form onSubmit={onSubmitEdit} className="lead-detail__form" noValidate>
                    <div className="lead-detail__row">
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Nome</label>
                        <Input {...editForm.register('name')} />
                      </div>
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Telefone</label>
                        <Input {...editForm.register('phone')} />
                      </div>
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Email</label>
                        <Input type="email" {...editForm.register('email')} />
                      </div>
                    </div>
                    <div className="lead-detail__row">
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Status</label>
                        <select
                          className="lead-detail__select"
                          {...editForm.register('status')}
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {LEAD_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Origem</label>
                        <select
                          className="lead-detail__select"
                          {...editForm.register('origin')}
                        >
                          {LEAD_ORIGINS.map((o) => (
                            <option key={o} value={o}>
                              {LEAD_ORIGIN_LABELS[o]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Interesse em</label>
                        <Controller
                          control={editForm.control}
                          name="interest_purpose"
                          render={({ field }) => (
                            <select
                              className="lead-detail__select"
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : e.target.value)
                              }
                            >
                              <option value="">—</option>
                              {PROPERTY_PURPOSES.map((p) => (
                                <option key={p} value={p}>
                                  {PROPERTY_PURPOSE_LABELS[p]}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </div>
                    </div>
                    <div className="lead-detail__row">
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Tipo de imóvel</label>
                        <Input {...editForm.register('interest_type')} />
                      </div>
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Cidade</label>
                        <Input {...editForm.register('preferred_city')} />
                      </div>
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Região</label>
                        <Input {...editForm.register('preferred_region')} />
                      </div>
                    </div>
                    <div className="lead-detail__row">
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Orçamento mín (R$)</label>
                        <Input type="number" step="0.01" {...editForm.register('budget_min')} />
                      </div>
                      <div className="lead-detail__field">
                        <label className="lead-detail__label">Orçamento máx (R$)</label>
                        <Input type="number" step="0.01" {...editForm.register('budget_max')} />
                        {editForm.formState.errors.budget_max && (
                          <span className="lead-detail__error-msg">
                            {editForm.formState.errors.budget_max.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="lead-detail__field">
                      <label className="lead-detail__label">Observações</label>
                      <textarea
                        rows={3}
                        className="lead-detail__textarea"
                        {...editForm.register('notes')}
                      />
                    </div>

                    <div className="lead-detail__edit-actions">
                      <button
                        type="button"
                        className="lead-modal__btn lead-modal__btn--ghost"
                        onClick={() => setMode('view')}
                        disabled={updateMutation.isPending}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="lead-modal__btn lead-modal__btn--primary"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Salvando…
                          </>
                        ) : (
                          <>
                            <Check size={16} aria-hidden="true" /> Salvar alterações
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              <section className="lead-detail__section">
                <h3 className="lead-detail__section-title">
                  <MessageSquare size={14} aria-hidden="true" /> Timeline ({interactions.length})
                </h3>

                <form onSubmit={onSubmitInteraction} className="lead-detail__interaction-form">
                  <select
                    className="lead-detail__select"
                    {...interactionForm.register('type')}
                  >
                    {MANUAL_INTERACTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {INTERACTION_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="O que aconteceu? Ex.: 'Ligou interessado no Vista Park'"
                    {...interactionForm.register('content')}
                  />
                  <button
                    type="submit"
                    className="lead-modal__btn lead-modal__btn--primary"
                    disabled={addInteractionMutation.isPending}
                  >
                    <Plus size={14} aria-hidden="true" /> Registrar
                  </button>
                </form>
                {interactionForm.formState.errors.content && (
                  <span className="lead-detail__error-msg">
                    {interactionForm.formState.errors.content.message}
                  </span>
                )}

                <ul className="lead-detail__timeline">
                  {formattedInteractions.length === 0 && !interactionsQuery.isLoading && (
                    <li className="lead-detail__timeline-empty">
                      Nenhuma interação registrada ainda.
                    </li>
                  )}
                  {formattedInteractions.map((i) => (
                    <li key={i.id} className="lead-detail__timeline-item">
                      <div className="lead-detail__timeline-icon">
                        <Calendar size={12} aria-hidden="true" />
                      </div>
                      <div className="lead-detail__timeline-content">
                        <div className="lead-detail__timeline-row">
                          <span className={`tag tag--${i.type}`}>
                            {INTERACTION_TYPE_LABELS[i.type]}
                          </span>
                          <time className="lead-detail__timeline-date">{i.displayDate}</time>
                        </div>
                        {i.content && (
                          <p className="lead-detail__timeline-text">{i.content}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}
