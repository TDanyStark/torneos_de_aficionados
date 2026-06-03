import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Paginated } from '@/lib/apiTypes'
import type {
  CreateTournamentMinimalPayload,
  FollowedTournament,
  Tournament,
  TournamentFilters,
  UpdateTournamentPayload,
} from '../types'

export const tournamentKeys = {
  all: ['tournaments'] as const,
  list: (filters: TournamentFilters) =>
    ['tournaments', 'list', filters] as const,
  detail: (slug: string) => ['tournaments', 'detail', slug] as const,
  manageBySlug: (slug: string) =>
    ['tournaments', 'by-slug', slug] as const,
}

/** Public, paginated tournament list with URL-driven filters. */
export function useTournamentList(filters: TournamentFilters) {
  return useQuery({
    queryKey: tournamentKeys.list(filters),
    queryFn: ({ signal }) =>
      apiClient.getPaginated<Tournament>(
        '/tournaments',
        {
          page: filters.page,
          q: filters.q,
          sport: filters.sport,
          status: filters.status,
        },
        signal,
      ),
    placeholderData: (prev) => prev as Paginated<Tournament> | undefined,
  })
}

/** Public tournament detail by slug. */
export function useTournamentDetail(slug: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.detail(slug ?? ''),
    enabled: Boolean(slug),
    queryFn: ({ signal }) =>
      apiClient.get<Tournament>(`/tournaments/${slug}`, undefined, signal),
  })
}

/**
 * Owner/admin tournament detail by slug for management views (edit, teams,
 * registrations, fixtures). Hits the authed `by-slug` endpoint so management
 * pages can be addressed by the canonical slug while still resolving the
 * numeric id the nested management APIs require.
 */
export function useTournamentBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.manageBySlug(slug ?? ''),
    enabled: Boolean(slug),
    queryFn: ({ signal }) =>
      apiClient.get<Tournament>(
        `/tournaments/by-slug/${slug}`,
        undefined,
        signal,
      ),
  })
}

/**
 * Tournaments where the logged-in user is organizer or delegate, annotated with
 * `my_roles`. Backs the "Torneos que sigo" view (merged with localStorage
 * follows). Disabled when there's no session.
 *
 * `includeHidden=true` returns ONLY the tournaments the user has hidden (the
 * "Ver ocultos" view); the default returns the visible ones.
 */
export function useFollowedTournaments(enabled: boolean, includeHidden = false) {
  return useQuery({
    queryKey: ['tournaments', 'followed-mine', includeHidden] as const,
    enabled,
    queryFn: ({ signal }) =>
      apiClient.get<FollowedTournament[]>(
        '/me/tournaments',
        includeHidden ? { include_hidden: '1' } : undefined,
        signal,
      ),
  })
}

/**
 * Hide ($hidden=true) or restore a tournament from the user's "Torneos que
 * sigo" feed. Non-destructive: toggles hidden_at on the user's role rows.
 */
export function useSetFollowedVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, hidden }: { id: number; hidden: boolean }) =>
      apiClient.patch<{ tournament_id: number; hidden: boolean }>(
        `/me/tournaments/${id}/visibility`,
        { hidden },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments', 'followed-mine'] })
    },
  })
}

export function useCreateTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTournamentMinimalPayload) =>
      apiClient.post<Tournament>('/tournaments', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentKeys.all })
    },
  })
}

export function useUpdateTournament(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTournamentPayload) =>
      apiClient.put<Tournament>(`/tournaments/${id}`, payload),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: tournamentKeys.all })
      qc.invalidateQueries({ queryKey: tournamentKeys.detail(updated.slug) })
    },
  })
}

/**
 * Archive ($filed=true) or restore ($filed=false) a tournament from the
 * organizer dashboard. Non-destructive: toggles is_filed on the tournament.
 */
export function useSetTournamentFiled() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, filed }: { id: number; filed: boolean }) =>
      apiClient.patch<{ tournament_id: number; is_filed: boolean }>(
        `/tournaments/${id}/filed`,
        { filed },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentKeys.all })
    },
  })
}

/** Counts of what deleting a tournament would remove (for the confirm dialog). */
export interface TournamentDeletionImpact {
  teams: number
  players: number
  matches: number
  events: number
}

/**
 * Preview of the destructive deletion impact. Disabled until `id` is provided
 * (e.g. only fetched when the confirm dialog opens).
 */
export function useTournamentDeletionImpact(id: number | undefined) {
  return useQuery({
    queryKey: ['tournaments', 'deletion-impact', id] as const,
    enabled: Boolean(id),
    queryFn: ({ signal }) =>
      apiClient.get<{
        tournament_id: number
        impact: TournamentDeletionImpact
      }>(`/tournaments/${id}/deletion-impact`, undefined, signal),
  })
}

/**
 * DESTRUCTIVE delete: permanently removes the tournament and everything under
 * it (teams, rosters, matches, events, image files). Pooled players preserved.
 */
export function useDeleteTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/tournaments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentKeys.all })
    },
  })
}
