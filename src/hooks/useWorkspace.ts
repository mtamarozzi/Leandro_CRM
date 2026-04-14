import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys } from '@/src/lib/queryKeys';
import {
  assertNoError,
  getCurrentWorkspaceId,
  uploadFile,
} from '@/src/lib/supabase-helpers';
import type { Database } from '@/src/types/database';
import type { WorkspaceUpdateInput } from '@/src/lib/schemas/workspace-schema';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

const LOGO_BUCKET = 'logos';

function extractExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/svg+xml') return 'svg';
  return 'bin';
}

export function useWorkspace() {
  return useQuery<Workspace>({
    queryKey: queryKeys.workspace.current(),
    queryFn: async () => {
      const workspaceId = await getCurrentWorkspaceId();
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
      assertNoError(error);
      if (!data) throw new Error('Workspace não encontrado');
      return data;
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation<Workspace, Error, WorkspaceUpdateInput>({
    mutationFn: async (input) => {
      const workspaceId = await getCurrentWorkspaceId();
      const { data, error } = await supabase
        .from('workspaces')
        .update({
          name: input.name,
          creci: input.creci ?? null,
          phone: input.phone ?? null,
          primary_color: input.primary_color,
        })
        .eq('id', workspaceId)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao atualizar workspace');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
    },
  });
}

export interface UploadLogoResult {
  workspace: Workspace;
  publicUrl: string;
}

export function useUploadWorkspaceLogo() {
  const queryClient = useQueryClient();

  return useMutation<UploadLogoResult, Error, File>({
    mutationFn: async (file) => {
      const workspaceId = await getCurrentWorkspaceId();
      const ext = extractExtension(file);
      const path = `${workspaceId}/logo.${ext}`;

      const { publicUrl } = await uploadFile(LOGO_BUCKET, path, file, {
        upsert: true,
      });

      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

      const { data, error } = await supabase
        .from('workspaces')
        .update({ logo_url: cacheBustedUrl })
        .eq('id', workspaceId)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao salvar logo no workspace');

      return { workspace: data, publicUrl: cacheBustedUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
    },
  });
}
