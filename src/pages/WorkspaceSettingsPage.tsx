import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/ui/color-picker';
import { LogoUploader } from '@/components/ui/logo-uploader';
import {
  DEFAULT_PRIMARY_COLOR,
  workspaceUpdateSchema,
  type WorkspaceUpdateInput,
} from '@/src/lib/schemas/workspace-schema';
import {
  useUpdateWorkspace,
  useUploadWorkspaceLogo,
  useWorkspace,
} from '@/src/hooks/useWorkspace';

export function WorkspaceSettingsPage() {
  const navigate = useNavigate();
  const workspaceQuery = useWorkspace();
  const updateMutation = useUpdateWorkspace();
  const uploadLogoMutation = useUploadWorkspaceLogo();

  const workspace = workspaceQuery.data;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<WorkspaceUpdateInput>({
    resolver: zodResolver(workspaceUpdateSchema),
    defaultValues: {
      name: '',
      creci: '',
      phone: '',
      primary_color: DEFAULT_PRIMARY_COLOR,
    },
  });

  useEffect(() => {
    if (workspace) {
      reset({
        name: workspace.name,
        creci: workspace.creci ?? '',
        phone: workspace.phone ?? '',
        primary_color: workspace.primary_color ?? DEFAULT_PRIMARY_COLOR,
      });
    }
  }, [workspace, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync(values);
      toast.success('Configurações salvas com sucesso.');
      reset(values);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar configurações.';
      toast.error(message);
    }
  });

  const handleLogoUpload = async (file: File) => {
    try {
      await uploadLogoMutation.mutateAsync(file);
      toast.success('Logo atualizada com sucesso.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar logo.';
      toast.error(message);
    }
  };

  if (workspaceQuery.isLoading) {
    return (
      <div className="workspace-settings workspace-settings--loading">
        <p>Carregando configurações…</p>
      </div>
    );
  }

  if (workspaceQuery.isError || !workspace) {
    return (
      <div className="workspace-settings workspace-settings--error">
        <p>Não foi possível carregar o workspace.</p>
        <button
          type="button"
          className="workspace-settings__back"
          onClick={() => navigate({ to: '/' })}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="workspace-settings">
      <div className="workspace-settings__bg" aria-hidden="true" />

      <header className="workspace-settings__header">
        <button
          type="button"
          className="workspace-settings__back"
          onClick={() => navigate({ to: '/' })}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Voltar</span>
        </button>
        <div>
          <h1 className="workspace-settings__title">Configurações do workspace</h1>
          <p className="workspace-settings__subtitle">
            Personalize os dados da imobiliária, cor primária e logo do catálogo público.
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="workspace-settings__grid" noValidate>
        <section className="workspace-settings__card">
          <h2 className="workspace-settings__card-title">Dados da imobiliária</h2>

          <div className="workspace-settings__field">
            <label htmlFor="ws-name" className="workspace-settings__label">
              Nome do workspace
            </label>
            <Input
              id="ws-name"
              placeholder="Ex.: Leandro Alonso Imóveis"
              aria-invalid={errors.name ? 'true' : 'false'}
              {...register('name')}
            />
            {errors.name && (
              <span className="workspace-settings__error">{errors.name.message}</span>
            )}
          </div>

          <div className="workspace-settings__field-row">
            <div className="workspace-settings__field">
              <label htmlFor="ws-creci" className="workspace-settings__label">
                CRECI
              </label>
              <Input
                id="ws-creci"
                placeholder="Ex.: 300771-F"
                aria-invalid={errors.creci ? 'true' : 'false'}
                {...register('creci')}
              />
              {errors.creci && (
                <span className="workspace-settings__error">{errors.creci.message}</span>
              )}
            </div>

            <div className="workspace-settings__field">
              <label htmlFor="ws-phone" className="workspace-settings__label">
                Telefone / WhatsApp
              </label>
              <Input
                id="ws-phone"
                placeholder="Ex.: (13) 9 9999-0000"
                aria-invalid={errors.phone ? 'true' : 'false'}
                {...register('phone')}
              />
              {errors.phone && (
                <span className="workspace-settings__error">{errors.phone.message}</span>
              )}
            </div>
          </div>
        </section>

        <section className="workspace-settings__card">
          <h2 className="workspace-settings__card-title">Cor primária</h2>
          <p className="workspace-settings__card-hint">
            Usada em destaques, botões e cabeçalhos do catálogo público.
          </p>

          <Controller
            control={control}
            name="primary_color"
            render={({ field, fieldState }) => (
              <>
                <ColorPicker value={field.value} onChange={field.onChange} />
                {fieldState.error && (
                  <span className="workspace-settings__error">{fieldState.error.message}</span>
                )}
              </>
            )}
          />
        </section>

        <section className="workspace-settings__card workspace-settings__card--logo">
          <h2 className="workspace-settings__card-title">Logo do catálogo público</h2>
          <p className="workspace-settings__card-hint">
            Aparecerá apenas no catálogo público (a topbar do CRM continua com a logo padrão).
          </p>

          <LogoUploader
            currentUrl={workspace.logo_url}
            onFileSelected={handleLogoUpload}
            uploading={uploadLogoMutation.isPending}
          />
        </section>

        <footer className="workspace-settings__footer">
          <button
            type="button"
            className="workspace-settings__cancel"
            onClick={() => navigate({ to: '/' })}
            disabled={isSubmitting || updateMutation.isPending}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="workspace-settings__save"
            disabled={!isDirty || isSubmitting || updateMutation.isPending}
          >
            <Save size={16} aria-hidden="true" />
            <span>{updateMutation.isPending ? 'Salvando…' : 'Salvar alterações'}</span>
          </button>
        </footer>
      </form>
    </div>
  );
}
