import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { LiveMatch, MatchPeriod } from '../types'
import { liveKeys } from './useLiveMatch'

/**
 * Referee: start the next period — POST /matches/{id}/periods/start (201).
 * Period state changes the match status, so we just invalidate /live to refetch
 * the authoritative snapshot (no optimistic period invention).
 */
export function useStartPeriod(matchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient.post<MatchPeriod>(`/matches/${matchId}/periods/start`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: liveKeys.match(matchId) })
    },
  })
}

/** Referee: end the active period — POST /matches/{id}/periods/end (200). */
export function useEndPeriod(matchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient.post<MatchPeriod>(`/matches/${matchId}/periods/end`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: liveKeys.match(matchId) })
    },
  })
}

/**
 * Referee: finish + consolidate the match — POST /matches/{id}/finish (200).
 * Returns the consolidated match; invalidate /live AND the fixtures matches
 * lists so the calendar/standings pick up the final score.
 */
export function useFinishMatch(matchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.post<LiveMatch['match']>(`/matches/${matchId}/finish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: liveKeys.match(matchId) })
      qc.invalidateQueries({ queryKey: ['matches'] })
      qc.invalidateQueries({ queryKey: ['standings'] })
    },
  })
}
