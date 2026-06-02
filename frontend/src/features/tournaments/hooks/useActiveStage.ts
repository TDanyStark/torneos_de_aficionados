import { useMemo } from 'react'
import type { Stage } from '@/features/tournaments/types'

/**
 * Default active-stage rule (used when `?stage=` is absent or invalid):
 * sort by `position` ascending, then pick — in order of preference —
 *   1. the first stage with status `in_progress`,
 *   2. else the last stage with status `finished`,
 *   3. else the first stage.
 * Returns `null` when there are no stages.
 */
export function resolveDefaultStageId(stages: Stage[]): number | null {
  if (stages.length === 0) return null
  const ordered = [...stages].sort((a, b) => a.position - b.position)

  const inProgress = ordered.find((s) => s.status === 'in_progress')
  if (inProgress) return inProgress.id

  const finished = ordered.filter((s) => s.status === 'finished')
  if (finished.length > 0) return finished[finished.length - 1].id

  return ordered[0].id
}

/**
 * Resolves the effective active stage for the hub. The URL `?stage=` wins when
 * it points to an existing stage; otherwise the default rule
 * (`resolveDefaultStageId`) applies. Returns the resolved `Stage` (or `null`)
 * and its `stageId` for convenience.
 */
export function useActiveStage(
  stages: Stage[] | undefined,
  urlStageId: number | null,
): { stage: Stage | null; stageId: number | null } {
  return useMemo(() => {
    const list = stages ?? []
    const fromUrl =
      urlStageId !== null
        ? (list.find((s) => s.id === urlStageId) ?? null)
        : null
    const resolved =
      fromUrl ??
      (() => {
        const defaultId = resolveDefaultStageId(list)
        return list.find((s) => s.id === defaultId) ?? null
      })()
    return { stage: resolved, stageId: resolved?.id ?? null }
  }, [stages, urlStageId])
}
