import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Reads/writes a `?page=` URL param (1-based), keeping the stats tables
 * shareable/navigable — mirrors the useFixtureFilters URL-state convention.
 */
export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = useMemo(() => {
    const raw = Number(searchParams.get('page'))
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
  }, [searchParams])

  const setPage = useCallback(
    (next: number) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next <= 1) params.delete('page')
          else params.set('page', String(next))
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { page, setPage }
}
