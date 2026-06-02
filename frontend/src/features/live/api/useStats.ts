import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Paginated } from '@/lib/apiTypes'
import type { CardRow, TopScorer } from '../types'
import { liveKeys } from './useLiveMatch'

/** Public, paginated top-scorers — GET /tournaments/{id}/top-scorers. */
export function useTopScorers(
  tournamentId: number | undefined,
  page: number,
) {
  return useQuery({
    queryKey: liveKeys.topScorers(tournamentId ?? 0, page),
    enabled: Boolean(tournamentId) && Number(tournamentId) > 0,
    queryFn: ({ signal }) =>
      apiClient.getPaginated<TopScorer>(
        `/tournaments/${tournamentId}/top-scorers`,
        { page },
        signal,
      ),
    placeholderData: (prev) => prev as Paginated<TopScorer> | undefined,
  })
}

/** Public, paginated discipline (cards) — GET /tournaments/{id}/cards. */
export function useCards(tournamentId: number | undefined, page: number) {
  return useQuery({
    queryKey: liveKeys.cards(tournamentId ?? 0, page),
    enabled: Boolean(tournamentId) && Number(tournamentId) > 0,
    queryFn: ({ signal }) =>
      apiClient.getPaginated<CardRow>(
        `/tournaments/${tournamentId}/cards`,
        { page },
        signal,
      ),
    placeholderData: (prev) => prev as Paginated<CardRow> | undefined,
  })
}
