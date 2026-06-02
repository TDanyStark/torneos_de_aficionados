import { useQuery } from '@tanstack/react-query'
import { apiClient, ApiError } from '@/lib/apiClient'
import type { Player } from '../types'

export const playerLookupKeys = {
  lookup: (tournamentId: number, documentId: string) =>
    ['players', 'lookup', tournamentId, documentId] as const,
}

/**
 * Result of a cédula lookup: `found` carries the existing player (precarga),
 * `notFound` means the document is free (capture full data).
 */
export type LookupResult =
  | { state: 'found'; player: Player }
  | { state: 'notFound' }

/**
 * Looks up a player by document_id within the tournament organizer's pool.
 * A 404 from the backend is a valid "not registered yet" outcome, so it is
 * mapped to `notFound` instead of being thrown.
 *
 * The caller is expected to pass an already-debounced document_id.
 */
export function usePlayerLookup(
  tournamentId: number,
  documentId: string,
  enabled = true,
) {
  const trimmed = documentId.trim()
  return useQuery<LookupResult>({
    queryKey: playerLookupKeys.lookup(tournamentId, trimmed),
    enabled:
      enabled &&
      Number.isFinite(tournamentId) &&
      tournamentId > 0 &&
      trimmed.length >= 3,
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      try {
        const player = await apiClient.get<Player>(
          `/tournaments/${tournamentId}/players/lookup`,
          { document_id: trimmed },
          signal,
        )
        return { state: 'found', player }
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return { state: 'notFound' }
        }
        throw error
      }
    },
  })
}
