import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { invalidateFixtures } from '@/features/fixtures/api/useGenerateFixtures'
import type { Match } from '@/features/fixtures/types'
import type {
  AssignMatchRefereePayload,
  AssignStageRefereePayload,
  AssignStageRefereeResult,
  Referee,
  RefereePayload,
} from '../types'

export const refereeKeys = {
  list: (tournamentId: number) =>
    ['tournaments', tournamentId, 'referees'] as const,
}

/** Public list of referees for a tournament. */
export function useReferees(tournamentId: number | undefined) {
  return useQuery({
    queryKey: refereeKeys.list(tournamentId ?? 0),
    enabled: Boolean(tournamentId),
    queryFn: ({ signal }) =>
      apiClient.get<Referee[]>(
        `/tournaments/${tournamentId}/referees`,
        undefined,
        signal,
      ),
  })
}

/** Organizer: create a referee in the tournament directory. */
export function useCreateReferee(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RefereePayload) =>
      apiClient.post<Referee>(
        `/tournaments/${tournamentId}/referees`,
        payload,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: refereeKeys.list(tournamentId) })
    },
  })
}

/** Organizer: rename a referee. */
export function useUpdateReferee(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      refereeId,
      payload,
    }: {
      refereeId: number
      payload: RefereePayload
    }) => apiClient.put<Referee>(`/referees/${refereeId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: refereeKeys.list(tournamentId) })
    },
  })
}

/**
 * Organizer: delete a referee. The backend auto-nulls `matches.referee_id`
 * for any match where this referee was assigned, so fixtures are invalidated
 * too to keep the per-match selects in sync.
 */
export function useDeleteReferee(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (refereeId: number) =>
      apiClient.delete(`/referees/${refereeId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: refereeKeys.list(tournamentId) })
      invalidateFixtures(qc, tournamentId)
    },
  })
}

/** Organizer: assign (or clear) the referee of a single match. */
export function useAssignMatchReferee(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      matchId,
      ...payload
    }: AssignMatchRefereePayload & { matchId: number }) =>
      apiClient.post<Match>(`/matches/${matchId}/referee`, payload),
    onSuccess: () => invalidateFixtures(qc, tournamentId),
  })
}

/**
 * Organizer: bulk-assign (or clear) the referee for every match of a stage,
 * optionally scoped to a single round via `round_id`.
 */
export function useAssignStageReferee(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      stageId,
      ...payload
    }: AssignStageRefereePayload & { stageId: number }) =>
      apiClient.post<AssignStageRefereeResult>(
        `/stages/${stageId}/assign-referee`,
        payload,
      ),
    onSuccess: () => invalidateFixtures(qc, tournamentId),
  })
}
