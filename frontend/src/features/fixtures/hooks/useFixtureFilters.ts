import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FixtureFilters, MatchStatus } from '../types'

const STATUS_VALUES: MatchStatus[] = [
  'scheduled',
  'live',
  'paused',
  'finished',
  'postponed',
  'walkover',
]

function parseStatus(value: string | null): MatchStatus | undefined {
  if (value && STATUS_VALUES.includes(value as MatchStatus)) {
    return value as MatchStatus
  }
  return undefined
}

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/**
 * Reads fixture/standings filters from the URL (?group=&round=&status=) and
 * exposes a setter that patches the query string — keeping the calendar,
 * standings and bracket views shareable/navigable.
 */
export function useFixtureFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<FixtureFilters>(() => {
    return {
      group: parsePositiveInt(searchParams.get('group')),
      round: parsePositiveInt(searchParams.get('round')),
      status: parseStatus(searchParams.get('status')),
    }
  }, [searchParams])

  const setFilters = useCallback(
    (patch: Partial<FixtureFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const apply = (
            key: string,
            value: string | number | undefined,
          ) => {
            if (value === undefined || value === '' || value === null) {
              next.delete(key)
            } else {
              next.set(key, String(value))
            }
          }
          if ('group' in patch) apply('group', patch.group)
          if ('round' in patch) apply('round', patch.round)
          if ('status' in patch) apply('status', patch.status)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { filters, setFilters }
}
