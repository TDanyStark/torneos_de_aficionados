import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { StandingsResponse } from '../types'

export const standingsKeys = {
  byGroup: (groupId: number) => ['standings', 'group', groupId] as const,
}

/** Public standings table for a single group. */
export function useStandings(groupId: number | undefined) {
  return useQuery({
    queryKey: standingsKeys.byGroup(groupId ?? 0),
    enabled: Boolean(groupId),
    queryFn: ({ signal }) =>
      apiClient.get<StandingsResponse>(
        `/groups/${groupId}/standings`,
        undefined,
        signal,
      ),
  })
}
