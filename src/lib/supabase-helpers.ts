import { supabase } from '@/src/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

// ============================================================================
// supabase-helpers.ts — Utilitários para queries e mutations no Supabase
// ============================================================================
// Funções pequenas e tipadas que removem repetição dos hooks de CRUD.
//
// - getCurrentWorkspaceId: pega o workspace do usuário logado (para INSERTs)
// - assertNoError: transforma erro do Supabase em Error JS jogável
// - uploadFile: upload em bucket + retorna URL pública
// - deleteFile: remove arquivo do storage
// ============================================================================

/**
 * Retorna o workspace_id do usuário atualmente autenticado.
 *
 * Lê do `profiles` (que é populado automaticamente pelo trigger handle_new_user
 * quando o usuário se cadastra). Se não houver sessão ativa, lança erro.
 *
 * Usado nos hooks de mutation (insert/update) quando precisamos garantir
 * que o registro vai para o workspace correto.
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('workspace_id')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new Error(`Não foi possível obter workspace: ${error.message}`);
  }

  if (!data?.workspace_id) {
    throw new Error('Profile sem workspace vinculado');
  }

  return data.workspace_id;
}

/**
 * Joga o erro do Supabase como Error JS, para ser capturado pelo
 * try/catch do React Query (que então marca a query/mutation como `error`).
 *
 * Uso típico:
 *   const { data, error } = await supabase.from('leads').select();
 *   assertNoError(error);
 *   return data;
 */
export function assertNoError(error: PostgrestError | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Faz upload de um arquivo para um bucket do Supabase Storage e retorna
 * a URL pública para uso direto em <img src="..."> ou similar.
 *
 * @param bucket - Nome do bucket (ex: 'properties', 'avatars', 'logos')
 * @param path - Caminho dentro do bucket (ex: 'workspace_id/property_id/foto.jpg')
 * @param file - O File em si (vindo de input[type=file] ou drop)
 * @param options - Opções extras (upsert, contentType custom)
 * @returns URL pública pronta para uso
 */
export interface UploadFileResult {
  /** URL pública para uso em <img> */
  publicUrl: string;
  /** Caminho interno no bucket (para deletar depois, se necessário) */
  storagePath: string;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options: { upsert?: boolean; contentType?: string } = {}
): Promise<UploadFileResult> {
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options.upsert ?? false,
      contentType: options.contentType ?? file.type,
      cacheControl: '3600',
    });

  if (uploadError) {
    throw new Error(`Erro no upload: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);

  return {
    publicUrl,
    storagePath: uploadData.path,
  };
}

/**
 * Remove um arquivo do bucket. Usado quando o usuário troca a logo,
 * remove uma foto de imóvel, etc.
 *
 * @param bucket - Nome do bucket
 * @param path - Caminho interno (vem do storage_path salvo no banco)
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Erro ao deletar arquivo: ${error.message}`);
  }
}

/**
 * Gera um nome de arquivo único usando timestamp + parte do nome original.
 * Evita colisões quando o usuário sobe arquivos com o mesmo nome.
 *
 * Ex: "minha foto.jpg" → "1763042156000-minha-foto.jpg"
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const cleaned = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${timestamp}-${cleaned}`;
}
