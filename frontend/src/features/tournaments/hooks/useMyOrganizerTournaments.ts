import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/stores/authStore'
import type { Tournament } from '../types'
import { tournamentKeys } from '../api/useTournaments'

/**
 * Derives the tournaments where the current user is an organizer from the
 * per-tournament roles in authStore (populated by /me), then fetches each
 * tournament's detail.
 *
 * NOTE: There is no dedicated "my tournaments" endpoint in the Fase 2 contract,
 * so we resolve organizer tournament ids from /me roles and load details
 * individually. Detail is fetched by slug per the contract; since /me returns
 * tournament_id (not slug), we query the public list once and match by id.
 */
export function useMyOrganizerTournaments() {
  const roles = useAuthStore((s) => s.roles)

  const organizerIds = useMemo(
    () =>
      Array.from(
        new Set(
          roles
            .filter((r) => r.role === 'organizer')
            .map((r) => r.tournament_id),
        ),
      ),
    [roles],
  )

  const results = useQueries({
    queries: organizerIds.map((id) => ({
      queryKey: [...tournamentKeys.all, 'by-id', id] as const,
      queryFn: () => apiClient.get<Tournament>(`/tournaments/${id}`),
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)
  const tournaments = results
    .map((r) => r.data)
    .filter((t): t is Tournament => Boolean(t))

  return { organizerIds, tournaments, isLoading, isError }
}
