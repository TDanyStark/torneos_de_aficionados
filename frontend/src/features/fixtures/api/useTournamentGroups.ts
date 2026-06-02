import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Group, Stage } from '@/features/tournaments/types'
import { groupKeys } from '@/features/tournaments/api/useGroups'

/**
 * Aggregates every group across all stages of a tournament. Used by the
 * calendar and standings group selectors. Returns a flat, de-duplicated list.
 */
export function useTournamentGroups(stages: Stage[] | undefined) {
  const stageIds = useMemo(
    () => (stages ?? []).map((s) => s.id),
    [stages],
  )

  const results = useQueries({
    queries: stageIds.map((stageId) => ({
      queryKey: groupKeys.list(stageId),
      queryFn: () => apiClient.get<Group[]>(`/stages/${stageId}/groups`),
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)

  const groups = useMemo(() => {
    const flat: Group[] = []
    for (const r of results) {
      if (r.data) flat.push(...r.data)
    }
    return flat.sort((a, b) => a.position - b.position)
  }, [results])

  return { groups, isLoading, isError }
}
