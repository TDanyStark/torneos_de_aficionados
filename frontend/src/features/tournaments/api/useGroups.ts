import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { CreateGroupPayload, Group, UpdateGroupPayload } from '../types'

export const groupKeys = {
  list: (stageId: number) => ['stages', stageId, 'groups'] as const,
}

export function useGroups(stageId: number | undefined) {
  return useQuery({
    queryKey: groupKeys.list(stageId ?? 0),
    enabled: Boolean(stageId),
    queryFn: () => apiClient.get<Group[]>(`/stages/${stageId}/groups`),
  })
}

export function useCreateGroup(stageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) =>
      apiClient.post<Group>(`/stages/${stageId}/groups`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.list(stageId) })
    },
  })
}

export function useUpdateGroup(stageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: number
      payload: UpdateGroupPayload
    }) => apiClient.put<Group>(`/groups/${groupId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.list(stageId) })
    },
  })
}

export function useDeleteGroup(stageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (groupId: number) => apiClient.delete(`/groups/${groupId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.list(stageId) })
    },
  })
}
