import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Paginated } from '@/lib/apiTypes'
import type { CardRow, TopScorer } from '../types'
import { liveKeys } from './useLiveMatch'

/**
 * Appends repeated `stage_id[]=` entries to a path. The shared apiClient query
 * serializer (`buildUrl`) only handles scalar params, so the repeated array
 * param required by the backend is built here by hand. `page` is left to the
 * apiClient `query` object so its existing semantics stay intact.
 */
function withStageIds(path: string, stageIds: number[]): string {
  if (stageIds.length === 0) return path
  const params = new URLSearchParams()
  for (const id of stageIds) params.append('stage_id[]', String(id))
  return `${path}?${params.toString()}`
}

/**
 * Public, paginated top-scorers — GET /tournaments/{id}/top-scorers.
 *
 * `stageIds` filters the goals to the matches of the given stages (repeated
 * `stage_id[]` query param). An empty array means "all phases" (unchanged
 * endpoint behaviour).
 */
export function useTopScorers(
  tournamentId: number | undefined,
  page: number,
  stageIds: number[] = [],
) {
  return useQuery({
    queryKey: liveKeys.topScorers(tournamentId ?? 0, page, stageIds),
    enabled: Boolean(tournamentId) && Number(tournamentId) > 0,
    queryFn: ({ signal }) =>
      apiClient.getPaginated<TopScorer>(
        withStageIds(`/tournaments/${tournamentId}/top-scorers`, stageIds),
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
