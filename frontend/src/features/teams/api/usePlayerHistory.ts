import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { PlayerHistory } from '../types'

export const playerHistoryKeys = {
  detail: (playerId: number) => ['players', playerId, 'history'] as const,
}

/**
 * Player history derived across the organizer's tournaments. Only the
 * organizer-owner may read it; a 403 surfaces through the query error.
 */
export function usePlayerHistory(playerId: number | undefined) {
  return useQuery({
    queryKey: playerHistoryKeys.detail(playerId ?? 0),
    enabled: Boolean(playerId) && Number(playerId) > 0,
    retry: false,
    queryFn: ({ signal }) =>
      apiClient.get<PlayerHistory>(
        `/players/${playerId}/history`,
        undefined,
        signal,
      ),
  })
}
