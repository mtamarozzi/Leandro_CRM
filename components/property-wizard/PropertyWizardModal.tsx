import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogPortal } from '@/components/ui/dialog';
import { PhotoUploader } from '@/components/ui/photo-uploader';
import {
  PROPERTY_FORM_DEFAULTS,
  propertyFullSchema,
  type PropertyFullInput,
} from '@/src/lib/schemas/property-schema';
import {
  useCreateProperty,
  useDeletePropertyMedia,
  useProperty,
  usePropertyMedia,
  useReorderPropertyMedia,
  useSetCoverMedia,
  useUpdateProperty,
  useUploadPropertyMedia,
} from '@/src/hooks/useProperties';
import { Step1Identification } from './Step1Identification';
import { Step2Location } from './Step2Location';
import { Step3Features } from './Step3Features';
import { Step4ValuesPhotos } from './Step4ValuesPhotos';

interface PropertyWizardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (propertyId: string) => void;
  /** Quando preenchido, o modal abre em modo edição. */
  editingId?: string | null;
}

type StepKey = 1 | 2 | 3 | 4;

const STEPS: Array<{ key: StepKey; label: string }> = [
  { key: 1, label: 'Identificação' },
  { key: 2, label: 'Localização' },
  { key: 3, label: 'Características' },
  { key: 4, label: 'Valores e fotos' },
];

const STEP_FIELDS: Record<StepKey, Array<keyof PropertyFullInput>> = {
  1: ['purpose', 'kind', 'status', 'development_name', 'developer', 'is_featured', 'is_public'],
  2: ['city', 'neighborhood', 'full_address', 'floor', 'latitude', 'longitude'],
  3: [
    'usable_area_m2',
    'bedrooms',
    'suites',
    'bathrooms',
    'parking_spots',
    'garage_type',
    'is_furnished',
    'has_balcony',
    'pet_friendly',
  ],
  4: [
    'sale_price',
    'rent_price',
    'condo_fee',
    'iptu',
    'total_monthly',
    'guarantee_type',
    'contract_type',
    'min_contract',
    'availability',
    'payment_conditions',
    'highlights',
    'public_description',
  ],
};

export function PropertyWizardModal({
  open,
  onClose,
  onCreated,
  editingId = null,
}: PropertyWizardModalProps) {
  const isEdit = editingId !== null;
  const [currentStep, setCurrentStep] = useState<StepKey>(1);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const methods = useForm<PropertyFullInput>({
    resolver: zodResolver(propertyFullSchema),
    defaultValues: PROPERTY_FORM_DEFAULTS,
    mode: 'onBlur',
  });

  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const uploadMediaMutation = useUploadPropertyMedia();
  const reorderMediaMutation = useReorderPropertyMedia();
  const setCoverMutation = useSetCoverMedia();
  const deleteMediaMutation = useDeletePropertyMedia();

  const propertyQuery = useProperty(editingId ?? undefined);
  const effectiveId = editingId ?? createdId;
  const mediaQuery = usePropertyMedia(effectiveId ?? undefined);

  useEffect(() => {
    if (!open) return;
    setCurrentStep(1);
    if (isEdit && propertyQuery.data) {
      const p = propertyQuery.data;
      methods.reset({
        purpose: p.purpose,
        kind: p.kind,
        status: p.status,
        development_name: p.development_name ?? undefined,
        developer: p.developer ?? undefined,
        is_featured: p.is_featured ?? false,
        is_public: p.is_public ?? true,
        city: p.city,
        neighborhood: p.neighborhood,
        full_address: p.full_address ?? undefined,
        floor: p.floor ?? undefined,
        latitude: p.latitude ?? undefined,
        longitude: p.longitude ?? undefined,
        usable_area_m2: p.usable_area_m2 ?? undefined,
        bedrooms: p.bedrooms ?? 0,
        suites: p.suites ?? 0,
        bathrooms: p.bathrooms ?? 0,
        parking_spots: p.parking_spots ?? 0,
        garage_type: p.garage_type ?? undefined,
        is_furnished: p.is_furnished ?? false,
        has_balcony: p.has_balcony ?? false,
        pet_friendly: p.pet_friendly ?? false,
        sale_price: p.sale_price ?? undefined,
        rent_price: p.rent_price ?? undefined,
        condo_fee: p.condo_fee ?? undefined,
        iptu: p.iptu ?? undefined,
        total_monthly: p.total_monthly ?? undefined,
        guarantee_type: p.guarantee_type ?? undefined,
        contract_type: p.contract_type ?? undefined,
        min_contract: p.min_contract ?? undefined,
        availability: p.availability ?? undefined,
        payment_conditions: p.payment_conditions ?? undefined,
        highlights: p.highlights ?? undefined,
        public_description: p.public_description ?? undefined,
      });
    } else if (!isEdit) {
      methods.reset(PROPERTY_FORM_DEFAULTS);
      setCreatedId(null);
    }
  }, [open, isEdit, propertyQuery.data, methods]);

  const isLastStep = currentStep === 4;
  const submitting = createMutation.isPending || updateMutation.isPending;

  const handleNext = async () => {
    const valid = await methods.trigger(STEP_FIELDS[currentStep]);
    if (!valid) return;
    if (!isLastStep) {
      setCurrentStep((s) => (s + 1) as StepKey);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => (s - 1) as StepKey);
    }
  };

  const handleSubmit = methods.handleSubmit(async (values) => {
    if (isEdit && editingId) {
      try {
        await updateMutation.mutateAsync({ id: editingId, patch: values });
        toast.success('Imóvel atualizado.');
        onClose();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar imóvel.';
        toast.error(message);
      }
      return;
    }
    if (createdId) return;
    try {
      const created = await createMutation.mutateAsync(values);
      setCreatedId(created.id);
      onCreated?.(created.id);
      toast.success(`Imóvel ${created.ref_code ?? ''} criado. Você já pode adicionar fotos.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar imóvel.';
      toast.error(message);
    }
  });

  const handleClose = () => {
    if (methods.formState.isDirty && !createdId) {
      const ok = window.confirm('Descartar alterações e fechar o cadastro?');
      if (!ok) return;
    }
    onClose();
  };

  const photosSlot = useMemo(() => {
    if (!effectiveId) return null;
    const propertyId = effectiveId;
    return (
      <PhotoUploader
        media={mediaQuery.data ?? []}
        uploading={uploadMediaMutation.isPending}
        onUploadFiles={async (files) => {
          for (const file of files) {
            try {
              await uploadMediaMutation.mutateAsync({ propertyId, file });
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Erro no upload.';
              toast.error(message);
              break;
            }
          }
        }}
        onReorder={(orderedIds) =>
          reorderMediaMutation.mutate({ propertyId, orderedIds })
        }
        onSetCover={(mediaId) =>
          setCoverMutation.mutate({ propertyId, mediaId })
        }
        onDelete={(media) =>
          deleteMediaMutation.mutate({
            propertyId,
            mediaId: media.id,
            storagePath: media.storage_path,
          })
        }
      />
    );
  }, [
    effectiveId,
    mediaQuery.data,
    uploadMediaMutation,
    reorderMediaMutation,
    setCoverMutation,
    deleteMediaMutation,
  ]);

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : handleClose())}>
      <DialogPortal>
        <DialogContent className="property-wizard" showCloseButton={false}>
          <FormProvider {...methods}>
            <header className="property-wizard__header">
              <div>
                <h2 className="property-wizard__title">
                  {isEdit
                    ? 'Editar imóvel'
                    : createdId
                      ? 'Imóvel cadastrado'
                      : 'Novo imóvel'}
                </h2>
                <p className="property-wizard__subtitle">
                  {isEdit
                    ? 'Atualize os dados e gerencie as fotos.'
                    : createdId
                      ? 'Adicione fotos ou feche para continuar depois.'
                      : 'Preencha as 4 etapas para cadastrar o imóvel no catálogo.'}
                </p>
              </div>
              <button
                type="button"
                className="property-wizard__close"
                onClick={handleClose}
                aria-label="Fechar"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <ol className="property-wizard__steps" aria-label="Etapas">
              {STEPS.map((s) => {
                const isActive = s.key === currentStep;
                const isDone = s.key < currentStep || createdId !== null;
                return (
                  <li
                    key={s.key}
                    className={[
                      'property-wizard__step',
                      isActive && 'property-wizard__step--active',
                      isDone && 'property-wizard__step--done',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="property-wizard__step-bullet">
                      {isDone ? <Check size={12} aria-hidden="true" /> : s.key}
                    </span>
                    <span className="property-wizard__step-label">{s.label}</span>
                  </li>
                );
              })}
            </ol>

            <form
              className="property-wizard__body"
              onSubmit={(e) => {
                e.preventDefault();
                if (isLastStep && (isEdit || !createdId)) {
                  void handleSubmit();
                }
              }}
              noValidate
            >
              {(isEdit || !createdId) && currentStep === 1 && <Step1Identification />}
              {(isEdit || !createdId) && currentStep === 2 && <Step2Location />}
              {(isEdit || !createdId) && currentStep === 3 && <Step3Features />}
              {(isEdit || !createdId) && currentStep === 4 && (
                <>
                  <Step4ValuesPhotos />
                  {isEdit && photosSlot && (
                    <div className="wizard-step__photos">
                      <header className="wizard-step__header">
                        <h4 className="wizard-step__title">Fotos do imóvel</h4>
                        <p className="wizard-step__hint">
                          Arraste para reordenar. Clique na estrela pra definir a capa.
                        </p>
                      </header>
                      {photosSlot}
                    </div>
                  )}
                </>
              )}
              {!isEdit && createdId && (
                <div className="wizard-step">
                  <header className="wizard-step__header">
                    <h3 className="wizard-step__title">Fotos do imóvel</h3>
                    <p className="wizard-step__hint">
                      Arraste as imagens para reordenar. Clique na estrela pra definir a capa.
                    </p>
                  </header>
                  {photosSlot}
                </div>
              )}
            </form>

            <footer className="property-wizard__footer">
              <button
                type="button"
                className="property-wizard__btn property-wizard__btn--ghost"
                onClick={handlePrev}
                disabled={currentStep === 1 || submitting}
              >
                <ChevronLeft size={16} aria-hidden="true" /> Voltar
              </button>

              <span className="property-wizard__step-counter">
                Etapa {currentStep} de {STEPS.length}
              </span>

              {!isLastStep && (
                <button
                  type="button"
                  className="property-wizard__btn property-wizard__btn--primary"
                  onClick={handleNext}
                >
                  Próximo <ChevronRight size={16} aria-hidden="true" />
                </button>
              )}

              {isLastStep && (isEdit || !createdId) && (
                <button
                  type="button"
                  className="property-wizard__btn property-wizard__btn--primary"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Salvando…
                    </>
                  ) : (
                    <>
                      <Check size={16} aria-hidden="true" /> {isEdit ? 'Salvar alterações' : 'Salvar imóvel'}
                    </>
                  )}
                </button>
              )}

              {isLastStep && !isEdit && createdId && (
                <button
                  type="button"
                  className="property-wizard__btn property-wizard__btn--primary"
                  onClick={onClose}
                >
                  Concluir
                </button>
              )}
            </footer>
          </FormProvider>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
