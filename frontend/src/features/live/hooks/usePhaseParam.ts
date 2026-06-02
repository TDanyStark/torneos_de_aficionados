import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Reads/writes a `?phase=` URL param holding a comma-separated list of stage
 * ids (e.g. `?phase=1,2`) for the top-scorers phase filter. An empty list means
 * "all phases" and removes the param entirely. Mirrors the usePageParam /
 * useFixtureFilters URL-state convention ({ replace: true }).
 */
export function usePhaseParam() {
  const [searchParams, setSearchParams] = useSearchParams()

  const stageIds = useMemo<number[]>(() => {
    const raw = searchParams.get('phase')
    if (!raw) return []
    const seen = new Set<number>()
    for (const part of raw.split(',')) {
      const n = Number(part)
      if (Number.isFinite(n) && n > 0) seen.add(Math.floor(n))
    }
    return [...seen].sort((a, b) => a - b)
  }, [searchParams])

  const setStageIds = useCallback(
    (next: number[]) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next.length === 0) {
            params.delete('phase')
          } else {
            const value = [...new Set(next)]
              .sort((a, b) => a - b)
              .join(',')
            params.set('phase', value)
          }
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { stageIds, setStageIds }
}
