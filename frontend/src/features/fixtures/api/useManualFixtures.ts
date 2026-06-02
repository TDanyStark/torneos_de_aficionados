import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  CreateMatchPayload,
  CreateRoundPayload,
  Match,
  Round,
  UpdateRoundPayload,
} from '../types'
import { invalidateFixtures } from './useGenerateFixtures'

/* ------------------------------------------------------------------ */
/* Rounds (jornadas) — manual CRUD                                     */
/* ------------------------------------------------------------------ */

/** Organizer: create a round in a stage. `number` auto-assigns when omitted. */
export function useCreateRound(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      stageId,
      ...payload
    }: CreateRoundPayload & { stageId: number }) =>
      apiClient.post<Round>(`/stages/${stageId}/rounds`, payload),
    onSuccess: () => invalidateFixtures(qc, tournamentId),
  })
}

/** Organizer: update a round (partial). */
export function useUpdateRound(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      roundId,
      ...payload
    }: UpdateRoundPayload & { roundId: number }) =>
      apiClient.put<Round>(`/rounds/${roundId}`, payload),
    onSuccess: () => invalidateFixtures(qc, tournamentId),
  })
}

/**
 * Organizer: delete a round. 204 on success; 422 when the round has
 * played/in-progress matches (its unplayed matches are removed otherwise).
 */
export function useDeleteRound(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roundId: number) => apiClient.delete(`/rounds/${roundId}`),
    onSuccess: () => invalidateFixtures(qc, tournamentId),
  })
}

/* ------------------------------------------------------------------ */
/* Matches — manual CRUD                                               */
/* ------------------------------------------------------------------ */

/**
 * Organizer: create a match inside a round. Teams may be null (TBD) and
 * repeated pairings are allowed; the server rejects home === away.
 */
export function useCreateMatch(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      roundId,
      ...payload
    }: CreateMatchPayload & { roundId: number }) =>
      apiClient.post<Match>(`/rounds/${roundId}/matches`, payload),
    onSuccess: () => invalidateFixtures(qc, tournamentId),
  })
}

/**
 * Organizer: delete a match. 204 on success; 422 when the match is
 * live/paused/finished/walkover.
 */
export function useDeleteMatch(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (matchId: number) => apiClient.delete(`/matches/${matchId}`),
    onSuccess: () => invalidateFixtures(qc, tournamentId),
  })
}
