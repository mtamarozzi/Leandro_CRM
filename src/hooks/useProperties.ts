import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys, type PropertyFilters } from '@/src/lib/queryKeys';
import {
  assertNoError,
  deleteFile,
  generateUniqueFilename,
  getCurrentWorkspaceId,
  uploadFile,
} from '@/src/lib/supabase-helpers';
import type { Database } from '@/src/types/database';
import type { PropertyFullInput } from '@/src/lib/schemas/property-schema';

// ============================================================================
// useProperties.ts — Hooks de imóveis (CRUD + media)
// ============================================================================
// Cobre: listagem filtrada, detalhe, criação (com ref_code via RPC), update,
// soft-delete, e gestão de fotos (upload, reorder, set-cover, delete).
//
// Convenção de path no Storage:
//   properties/{workspace_id}/{property_id}/{filename}
// ============================================================================

type PropertyRow = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];
type MediaRow = Database['public']['Tables']['media']['Row'];

const PROPERTIES_BUCKET = 'properties';

// ---------------------------------------------------------------------------
// Listagem
// ---------------------------------------------------------------------------

export function useProperties(filters?: PropertyFilters) {
  return useQuery<PropertyRow[]>({
    queryKey: queryKeys.properties.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (filters?.purpose) query = query.eq('purpose', filters.purpose);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.city) query = query.ilike('city', `%${filters.city}%`);
      if (filters?.neighborhood)
        query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
      if (filters?.minPrice !== undefined)
        query = query.or(
          `sale_price.gte.${filters.minPrice},rent_price.gte.${filters.minPrice}`,
        );
      if (filters?.maxPrice !== undefined)
        query = query.or(
          `sale_price.lte.${filters.maxPrice},rent_price.lte.${filters.maxPrice}`,
        );
      if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(
          `ref_code.ilike.${term},development_name.ilike.${term},neighborhood.ilike.${term},full_address.ilike.${term}`,
        );
      }

      const { data, error } = await query;
      assertNoError(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------------
// Detalhe
// ---------------------------------------------------------------------------

export function useProperty(id: string | undefined) {
  return useQuery<PropertyRow | null>({
    queryKey: id ? queryKeys.properties.detail(id) : ['properties', 'detail', 'none'],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
      assertNoError(error);
      return data;
    },
  });
}

// ---------------------------------------------------------------------------
// Create (gera ref_code via RPC, depois insere)
// ---------------------------------------------------------------------------

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation<PropertyRow, Error, PropertyFullInput>({
    mutationFn: async (input) => {
      const workspaceId = await getCurrentWorkspaceId();

      const { data: refCode, error: rpcError } = await supabase.rpc(
        'generate_property_ref_code',
      );
      if (rpcError) throw new Error(`Erro ao gerar código: ${rpcError.message}`);
      if (!refCode) throw new Error('Falha ao gerar código de referência');

      const payload: PropertyInsert = {
        workspace_id: workspaceId,
        ref_code: refCode,
        purpose: input.purpose,
        kind: input.kind,
        status: input.status,
        development_name: input.development_name ?? null,
        developer: input.developer ?? null,
        is_featured: input.is_featured,
        is_public: input.is_public,
        city: input.city,
        neighborhood: input.neighborhood,
        full_address: input.full_address ?? null,
        floor: input.floor ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        usable_area_m2: input.usable_area_m2 ?? null,
        bedrooms: input.bedrooms,
        suites: input.suites,
        bathrooms: input.bathrooms,
        parking_spots: input.parking_spots,
        garage_type: input.garage_type ?? null,
        is_furnished: input.is_furnished,
        has_balcony: input.has_balcony,
        pet_friendly: input.pet_friendly,
        sale_price: input.sale_price ?? null,
        rent_price: input.rent_price ?? null,
        condo_fee: input.condo_fee ?? null,
        iptu: input.iptu ?? null,
        total_monthly: input.total_monthly ?? null,
        guarantee_type: input.guarantee_type ?? null,
        contract_type: input.contract_type ?? null,
        min_contract: input.min_contract ?? null,
        availability: input.availability ?? null,
        payment_conditions: input.payment_conditions ?? null,
        highlights: input.highlights ?? null,
        public_description: input.public_description ?? null,
      };

      const { data, error } = await supabase
        .from('properties')
        .insert(payload)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao criar imóvel');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export interface UpdatePropertyInput {
  id: string;
  patch: PropertyUpdate;
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation<PropertyRow, Error, UpdatePropertyInput>({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao atualizar imóvel');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
      queryClient.setQueryData(queryKeys.properties.detail(data.id), data);
    },
  });
}

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('properties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      assertNoError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Media — listagem
// ---------------------------------------------------------------------------

export function usePropertyMedia(propertyId: string | undefined) {
  return useQuery<MediaRow[]>({
    queryKey: propertyId
      ? queryKeys.properties.media(propertyId)
      : ['properties', 'media', 'none'],
    enabled: !!propertyId,
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true });
      assertNoError(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------------
// Media — upload
// ---------------------------------------------------------------------------

export interface UploadPropertyMediaInput {
  propertyId: string;
  file: File;
  caption?: string;
  isCover?: boolean;
}

export function useUploadPropertyMedia() {
  const queryClient = useQueryClient();

  return useMutation<MediaRow, Error, UploadPropertyMediaInput>({
    mutationFn: async ({ propertyId, file, caption, isCover }) => {
      const workspaceId = await getCurrentWorkspaceId();
      const filename = generateUniqueFilename(file.name);
      const path = `${workspaceId}/${propertyId}/${filename}`;

      const { publicUrl, storagePath } = await uploadFile(
        PROPERTIES_BUCKET,
        path,
        file,
        { upsert: false },
      );

      const { count } = await supabase
        .from('media')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId);

      const { data, error } = await supabase
        .from('media')
        .insert({
          workspace_id: workspaceId,
          property_id: propertyId,
          storage_path: storagePath,
          url: publicUrl,
          caption: caption ?? null,
          is_cover: isCover ?? false,
          display_order: count ?? 0,
        })
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao registrar mídia');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.media(data.property_id),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Media — reordenar (atualiza display_order de várias linhas)
// ---------------------------------------------------------------------------

export interface ReorderPropertyMediaInput {
  propertyId: string;
  /** Lista ordenada de IDs — index = display_order final. */
  orderedIds: string[];
}

export function useReorderPropertyMedia() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReorderPropertyMediaInput>({
    mutationFn: async ({ orderedIds }) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase
            .from('media')
            .update({ display_order: index })
            .eq('id', id)
            .then(({ error }) => assertNoError(error)),
        ),
      );
    },
    onSuccess: (_v, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.media(vars.propertyId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Media — definir cover (apenas uma linha is_cover=true por property)
// ---------------------------------------------------------------------------

export interface SetCoverMediaInput {
  propertyId: string;
  mediaId: string;
}

export function useSetCoverMedia() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SetCoverMediaInput>({
    mutationFn: async ({ propertyId, mediaId }) => {
      const { error: clearError } = await supabase
        .from('media')
        .update({ is_cover: false })
        .eq('property_id', propertyId);
      assertNoError(clearError);

      const { error: setError } = await supabase
        .from('media')
        .update({ is_cover: true })
        .eq('id', mediaId);
      assertNoError(setError);
    },
    onSuccess: (_v, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.media(vars.propertyId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Media — deletar (storage + linha)
// ---------------------------------------------------------------------------

export interface DeletePropertyMediaInput {
  propertyId: string;
  mediaId: string;
  storagePath: string;
}

export function useDeletePropertyMedia() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeletePropertyMediaInput>({
    mutationFn: async ({ mediaId, storagePath }) => {
      await deleteFile(PROPERTIES_BUCKET, storagePath);
      const { error } = await supabase.from('media').delete().eq('id', mediaId);
      assertNoError(error);
    },
    onSuccess: (_v, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.media(vars.propertyId),
      });
    },
  });
}
