import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  AddPlayerPayload,
  TeamPlayer,
  UpdateTeamPlayerPayload,
} from '../types'

export const rosterKeys = {
  list: (teamId: number) => ['teams', teamId, 'roster'] as const,
}

/** Public roster of a team. */
export function useRoster(teamId: number | undefined) {
  return useQuery({
    queryKey: rosterKeys.list(teamId ?? 0),
    enabled: Boolean(teamId) && Number(teamId) > 0,
    queryFn: ({ signal }) =>
      apiClient.get<TeamPlayer[]>(
        `/tournament-teams/${teamId}/players`,
        undefined,
        signal,
      ),
  })
}

/** Adds a player to the roster (reuses by cédula or creates a new player). */
export function useAddPlayer(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddPlayerPayload) =>
      apiClient.post<TeamPlayer>(
        `/tournament-teams/${teamId}/players`,
        payload,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rosterKeys.list(teamId) })
    },
  })
}

export function useUpdateTeamPlayer(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamPlayerId,
      payload,
    }: {
      teamPlayerId: number
      payload: UpdateTeamPlayerPayload
    }) => apiClient.put<TeamPlayer>(`/team-players/${teamPlayerId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rosterKeys.list(teamId) })
    },
  })
}

export function useDeleteTeamPlayer(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (teamPlayerId: number) =>
      apiClient.delete(`/team-players/${teamPlayerId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rosterKeys.list(teamId) })
    },
  })
}
