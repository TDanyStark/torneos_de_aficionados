import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Round } from '../types'

export const roundKeys = {
  list: (tournamentId: number) =>
    ['tournaments', tournamentId, 'rounds'] as const,
}

/** Public list of rounds (jornadas) for a tournament, ordered number ASC. */
export function useRounds(tournamentId: number | undefined) {
  return useQuery({
    queryKey: roundKeys.list(tournamentId ?? 0),
    enabled: Boolean(tournamentId),
    queryFn: ({ signal }) =>
      apiClient.get<Round[]>(
        `/tournaments/${tournamentId}/rounds`,
        undefined,
        signal,
      ),
  })
}
