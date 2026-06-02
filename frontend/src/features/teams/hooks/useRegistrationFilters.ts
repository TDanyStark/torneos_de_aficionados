import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { RegistrationFilters, RegistrationStatus } from '../types'

const STATUS_VALUES: RegistrationStatus[] = [
  'submitted',
  'pending',
  'approved',
  'rejected',
]

function parseStatus(value: string | null): RegistrationStatus | undefined {
  if (value && STATUS_VALUES.includes(value as RegistrationStatus)) {
    return value as RegistrationStatus
  }
  return undefined
}

/** URL-driven filters for the organizer registrations inbox (?page=&status=). */
export function useRegistrationFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<RegistrationFilters>(() => {
    const page = Number(searchParams.get('page')) || 1
    const status = parseStatus(searchParams.get('status'))
    return { page, status }
  }, [searchParams])

  const setFilters = useCallback(
    (patch: Partial<RegistrationFilters>) => {
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
