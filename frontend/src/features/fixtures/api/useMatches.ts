import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { FixtureFilters, Match, UpdateMatchPayload } from '../types'

export const matchKeys = {
  all: ['matches'] as const,
  list: (tournamentId: number, filters: FixtureFilters) =>
    ['matches', 'list', tournamentId, filters] as const,
}

/**
 * Public list of matches for a tournament, ordered by round number ASC.
 * Supports the `round`, `group` and `status` server-side filters.
 */
export function useMatches(
  tournamentId: number | undefined,
  filters: FixtureFilters,
) {
  return useQuery({
    queryKey: matchKeys.list(tournamentId ?? 0, filters),
    enabled: Boolean(tournamentId),
    queryFn: ({ signal }) =>
      apiClient.get<Match[]>(
        `/tournaments/${tournamentId}/matches`,
        {
          round: filters.round,
          group: filters.group,
          status: filters.status,
        },
        signal,
      ),
  })
}

/** Organizer: update venue / scheduled_at / referee of a match. */
export function useUpdateMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      matchId,
      payload,
    }: {
      matchId: number
      payload: UpdateMatchPayload
    }) => apiClient.put<Match>(`/matches/${matchId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchKeys.all })
    },
  })
}
