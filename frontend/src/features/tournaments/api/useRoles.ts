import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { CreateRolePayload, TournamentRole } from '../types'

export const roleKeys = {
  list: (tournamentId: number) =>
    ['tournaments', tournamentId, 'roles'] as const,
}

/** Lists referees/delegates/organizers assigned to a tournament. */
export function useTournamentRoles(tournamentId: number | undefined) {
  return useQuery({
    queryKey: roleKeys.list(tournamentId ?? 0),
    enabled: Boolean(tournamentId),
    queryFn: () =>
      apiClient.get<TournamentRole[]>(`/tournaments/${tournamentId}/roles`),
  })
}

/** Designates a role to a user by email. */
export function useCreateRole(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) =>
      apiClient.post<TournamentRole>(
        `/tournaments/${tournamentId}/roles`,
        payload,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.list(tournamentId) })
    },
  })
}

/** Removes a role assignment. Endpoint is keyed by the role row id. */
export function useDeleteRole(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: number) =>
      apiClient.delete(`/tournament-roles/${roleId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.list(tournamentId) })
    },
  })
}
