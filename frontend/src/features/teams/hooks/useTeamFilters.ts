import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TeamFilters, TeamStatus } from '../types'

const STATUS_VALUES: TeamStatus[] = [
  'pending',
  'approved',
  'rejected',
  'withdrawn',
]

function parseStatus(value: string | null): TeamStatus | undefined {
  if (value && STATUS_VALUES.includes(value as TeamStatus)) {
    return value as TeamStatus
  }
  return undefined
}

/**
 * Reads team list filters from the URL (?page=&q=&status=) and exposes a
 * setter that patches the query string — keeping views shareable/navigable.
 */
export function useTeamFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<TeamFilters>(() => {
    const page = Number(searchParams.get('page')) || 1
    const q = searchParams.get('q') ?? undefined
    const status = parseStatus(searchParams.get('status'))
    return {
      page,
      q: q || undefined,
      status,
    }
  }, [searchParams])

  const setFilters = useCallback(
    (patch: Partial<TeamFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const apply = (key: string, value: string | number | undefined) => {
            if (value === undefined || value === '' || value === null) {
              next.delete(key)
            } else {
              next.set(key, String(value))
            }
          }
          if ('q' in patch) apply('q', patch.q)
          if ('status' in patch) apply('status', patch.status)
          if ('page' in patch) apply('page', patch.page)
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { filters, setFilters }
}
