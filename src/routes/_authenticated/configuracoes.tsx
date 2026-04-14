import { createFileRoute } from '@tanstack/react-router';
import { WorkspaceSettingsPage } from '@/src/pages/WorkspaceSettingsPage';

export const Route = createFileRoute('/_authenticated/configuracoes')({
  component: WorkspaceSettingsPage,
});
