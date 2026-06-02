import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  AdsMap,
  AdSlot,
  AdSlotWithCreatives,
  AdCreative,
  CreateAdCreativePayload,
  CreateAdSlotPayload,
  UpdateAdCreativePayload,
  UpdateAdSlotPayload,
  UploadMediaResponse,
} from '../types'

export const adKeys = {
  all: ['ads'] as const,
  public: () => ['ads', 'public'] as const,
  tournament: (tournamentId: number) =>
    ['ads', 'tournament', tournamentId] as const,
  /** Admin: the slots (with creatives) scoped to a single tournament. */
  adminTournamentSlots: (tournamentId: number) =>
    ['ads', 'admin', 'tournament', tournamentId] as const,
}

/** Ads are static-ish; refetch sparingly to avoid layout churn. */
const ADS_STALE_TIME = 5 * 60 * 1000 // 5 min

/**
 * Public ad resolver. With a tournamentId → GET /tournaments/{id}/ads
 * (tournament slots with global fallback); without → GET /ads (global).
 * Returns a placement-keyed map; absent placements have nothing serveable.
 */
export function useAds(tournamentId?: number) {
  return useQuery({
    queryKey:
      tournamentId != null
        ? adKeys.tournament(tournamentId)
        : adKeys.public(),
    staleTime: ADS_STALE_TIME,
    queryFn: ({ signal }) =>
      apiClient.get<AdsMap>(
        tournamentId != null ? `/tournaments/${tournamentId}/ads` : '/ads',
        undefined,
        signal,
      ),
  })
}

/**
 * Admin: the ad slots scoped to a single tournament (each slot carries its
 * creatives inline). Backed by GET /admin/tournaments/{id}/ad-slots, which
 * returns a plain (non-paginated) list. Keyed under `adKeys.all` so the
 * shared creative/slot mutations invalidate it automatically.
 */
export function useTournamentAdSlots(tournamentId: number) {
  return useQuery({
    queryKey: adKeys.adminTournamentSlots(tournamentId),
    enabled: Number.isFinite(tournamentId) && tournamentId > 0,
    queryFn: ({ signal }) =>
      apiClient.get<AdSlotWithCreatives[]>(
        `/admin/tournaments/${tournamentId}/ad-slots`,
        undefined,
        signal,
      ),
  })
}

/** Invalidate every ads cache entry (admin + public + tournament). */
function useInvalidateAds() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: adKeys.all })
}

/* ------------------------------------------------------------------ */
/* Slot mutations                                                       */
/* ------------------------------------------------------------------ */

export function useCreateAdSlot() {
  const invalidate = useInvalidateAds()
  return useMutation({
    mutationFn: (payload: CreateAdSlotPayload) =>
      apiClient.post<AdSlotWithCreatives>('/ad-slots', payload),
    onSuccess: invalidate,
  })
}

export function useUpdateAdSlot(id: number) {
  const invalidate = useInvalidateAds()
  return useMutation({
    mutationFn: (payload: UpdateAdSlotPayload) =>
      apiClient.put<AdSlotWithCreatives>(`/ad-slots/${id}`, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteAdSlot() {
  const invalidate = useInvalidateAds()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/ad-slots/${id}`),
    onSuccess: invalidate,
  })
}

/* ------------------------------------------------------------------ */
/* Creative mutations                                                   */
/* ------------------------------------------------------------------ */

export function useCreateAdCreative() {
  const invalidate = useInvalidateAds()
  return useMutation({
    mutationFn: (payload: CreateAdCreativePayload) =>
      apiClient.post<AdCreative>('/ad-creatives', payload),
    onSuccess: invalidate,
  })
}

export function useUpdateAdCreative(id: number) {
  const invalidate = useInvalidateAds()
  return useMutation({
    mutationFn: (payload: UpdateAdCreativePayload) =>
      apiClient.put<AdCreative>(`/ad-creatives/${id}`, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteAdCreative() {
  const invalidate = useInvalidateAds()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/ad-creatives/${id}`),
    onSuccess: invalidate,
  })
}

/**
 * Uploads media (image/video) via multipart. The field name is `file`. Returns
 * the stored relative media_url + the resolved media_type. Does NOT touch the
 * ads cache (no slot/creative changed yet).
 */
export function useUploadMedia() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.postForm<UploadMediaResponse>(
        '/ad-creatives/upload',
        formData,
      )
    },
  })
}

export type { AdSlot, AdCreative }
