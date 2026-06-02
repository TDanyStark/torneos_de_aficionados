import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  AssignGroupTeamPayload,
  DistributeGroupsPayload,
  DistributeGroupsResult,
  GroupTeam,
} from '../types'
import { groupKeys } from './useGroups'

export const groupTeamKeys = {
  list: (groupId: number) => ['groups', groupId, 'teams'] as const,
}

export function useGroupTeams(groupId: number | undefined) {
  return useQuery({
    queryKey: groupTeamKeys.list(groupId ?? 0),
    enabled: Boolean(groupId),
    queryFn: () =>
      apiClient.get<GroupTeam[]>(`/groups/${groupId}/teams`),
  })
}

export function useAssignTeam(stageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: number
      payload: AssignGroupTeamPayload
    }) => apiClient.post<GroupTeam>(`/groups/${groupId}/teams`, payload),
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({ queryKey: groupTeamKeys.list(groupId) })
      qc.invalidateQueries({ queryKey: groupKeys.list(stageId) })
    },
  })
}

export function useRemoveTeam(stageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupTeamId }: { groupTeamId: number; groupId: number }) =>
      apiClient.delete(`/group-teams/${groupTeamId}`),
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({ queryKey: groupTeamKeys.list(groupId) })
      qc.invalidateQueries({ queryKey: groupKeys.list(stageId) })
    },
  })
}

export function useDistributeGroups(stageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DistributeGroupsPayload) =>
      apiClient.post<DistributeGroupsResult>(
        `/stages/${stageId}/groups/distribute`,
        payload,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.list(stageId) })
      // Distribution rebuilds every group of the stage, so invalidate all
      // per-group team lists (['groups', *, 'teams']).
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'groups' && query.queryKey[2] === 'teams',
      })
    },
  })
}
