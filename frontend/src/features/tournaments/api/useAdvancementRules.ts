import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  AdvancementRule,
  CreateAdvancementRulePayload,
  UpdateAdvancementRulePayload,
} from '../types'

export const advancementKeys = {
  list: (stageId: number) =>
    ['stages', stageId, 'advancement-rules'] as const,
}

export function useAdvancementRules(stageId: number | undefined) {
  return useQuery({
    queryKey: advancementKeys.list(stageId ?? 0),
    enabled: Boolean(stageId),
    queryFn: () =>
      apiClient.get<AdvancementRule[]>(`/stages/${stageId}/advancement-rules`),
  })
}

export function useCreateAdvancementRule(stageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAdvancementRulePayload) =>
      apiClient.post<AdvancementRule>(
        `/stages/${stageId}/advancement-rules`,
        payload,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advancementKeys.list(stageId) })
    },
  })
}

export function useUpdateAdvancementRule(stageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ruleId,
      payload,
    }: {
      ruleId: number
      payload: UpdateAdvancementRulePayload
    }) => apiClient.put<AdvancementRule>(`/advancement-rules/${ruleId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advancementKeys.list(stageId) })
    },
  })
}

export function useDeleteAdvancementRule(stageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: number) =>
      apiClient.delete(`/advancement-rules/${ruleId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advancementKeys.list(stageId) })
    },
  })
}
