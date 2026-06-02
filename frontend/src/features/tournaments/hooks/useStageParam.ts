import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Reads/writes the `?stage=` URL param for the tournament hub — the selected
 * phase (stage) for the phase-aware fixtures/standings views. Mirrors the
 * useFixtureFilters convention: a REPLACE patch so the phase selection is
 * shareable/navigable without flooding the browser history.
 *
 * `stageId` is `null` when the param is absent or invalid; callers resolve the
 * effective active stage via `useActiveStage`.
 */
export function useStageParam() {
  const [searchParams, setSearchParams] = useSearchParams()

  const stageId = useMemo(
    () => parsePositiveInt(searchParams.get('stage')),
    [searchParams],
  )

  const setStageId = useCallback(
    (next: number | null) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === null) params.delete('stage')
          else params.set('stage', String(next))
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { stageId, setStageId }
}
