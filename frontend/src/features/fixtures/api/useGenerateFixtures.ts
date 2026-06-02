import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { GenerateResult, RegenerateResult } from '../types'
import { roundKeys } from './useRounds'
import { matchKeys } from './useMatches'

/** Invalidate every fixtures-derived query for a tournament after a mutation. */
export function invalidateFixtures(
  qc: ReturnType<typeof useQueryClient>,
  tournamentId: number,
) {
  qc.invalidateQueries({ queryKey: roundKeys.list(tournamentId) })
  qc.invalidateQueries({ queryKey: matchKeys.all })
  qc.invalidateQueries({ queryKey: ['standings'] })
}

/**
 * Organizer: generate fixtures for a stage.
 * 422 when fixtures already exist (use regenerate) or the stage is not ready.
 */
export function useGenerateFixtures(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stageId: number) =>
      apiClient.post<GenerateResult>(`/stages/${stageId}/generate-fixtures`),
    onSuccess: () => invalidateFixtures(qc, tournamentId),
  })
}

/**
 * Organizer: regenerate future rounds of a stage to integrate late teams.
 * Idempotent over unplayed rounds; never alters finished/live matches.
 */
export function useRegenerateFixtures(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stageId: number) =>
      apiClient.post<RegenerateResult>(
        `/stages/${stageId}/regenerate-fixtures`,
      ),
    onSuccess: () => invalidateFixtures(qc, tournamentId),
  })
}
