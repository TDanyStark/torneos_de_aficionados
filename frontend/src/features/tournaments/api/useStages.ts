import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { CreateStagePayload, Stage, UpdateStagePayload } from '../types'

export const stageKeys = {
  list: (tournamentId: number) =>
    ['tournaments', tournamentId, 'stages'] as const,
}

export function useStages(tournamentId: number | undefined) {
  return useQuery({
    queryKey: stageKeys.list(tournamentId ?? 0),
    enabled: Boolean(tournamentId),
    queryFn: () =>
      apiClient.get<Stage[]>(`/tournaments/${tournamentId}/stages`),
  })
}

export function useCreateStage(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStagePayload) =>
      apiClient.post<Stage>(`/tournaments/${tournamentId}/stages`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stageKeys.list(tournamentId) })
    },
  })
}

export function useUpdateStage(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      stageId,
      payload,
    }: {
      stageId: number
      payload: UpdateStagePayload
    }) => apiClient.put<Stage>(`/stages/${stageId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stageKeys.list(tournamentId) })
    },
  })
}

export function useDeleteStage(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stageId: number) => apiClient.delete(`/stages/${stageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stageKeys.list(tournamentId) })
    },
  })
}
