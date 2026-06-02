import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Tournament } from '../types'
import { tournamentKeys } from '../api/useTournaments'

/**
 * Loads the authenticated organizer's tournaments via the dedicated
 * `GET /tournaments/mine` endpoint, which returns the full tournament
 * entities owned by the current user as a plain array.
 *
 * Replaces the previous approach that derived ids from /me roles and did
 * N per-id fetches of `/tournaments/{id}` — that route is slug-only and
 * 404'd on numeric ids.
 */
export function useMyOrganizerTournaments() {
  const query = useQuery({
    queryKey: [...tournamentKeys.all, 'mine'] as const,
    queryFn: ({ signal }) =>
      apiClient.get<Tournament[]>('/tournaments/mine', undefined, signal),
  })

  return {
    tournaments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
