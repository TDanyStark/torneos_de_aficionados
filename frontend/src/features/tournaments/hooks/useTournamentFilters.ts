import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TournamentFilters, TournamentStatus } from '../types'

const STATUS_VALUES: TournamentStatus[] = [
  'draft',
  'registration',
  'in_progress',
  'finished',
  'archived',
]

function parseStatus(value: string | null): TournamentStatus | undefined {
  if (value && STATUS_VALUES.includes(value as TournamentStatus)) {
    return value as TournamentStatus
  }
  return undefined
}

/**
 * Reads tournament list filters from the URL (?page=&q=&sport=&status=) and
 * exposes a setter that patches the query string — keeping views shareable
 * and navigable via browser back/forward.
 */
export function useTournamentFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<TournamentFilters>(() => {
    const page = Number(searchParams.get('page')) || 1
    const q = searchParams.get('q') ?? undefined
    const sportRaw = searchParams.get('sport')
    const sport = sportRaw ? Number(sportRaw) : undefined
    const status = parseStatus(searchParams.get('status'))
    return {
      page,
      q: q || undefined,
      sport: sport && !Number.isNaN(sport) ? sport : undefined,
      status,
    }
  }, [searchParams])

  const setFilters = useCallback(
    (patch: Partial<TournamentFilters>) => {
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
          if ('sport' in patch) apply('sport', patch.sport)
          if ('status' in patch) apply('status', patch.status)
          if ('page' in patch) apply('page', patch.page)
          // Reset to page 1 whenever a non-page filter changes.
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
