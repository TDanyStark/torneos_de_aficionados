import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
  RegistrationChannel,
  RegistrationFilters,
  RegistrationStatus,
} from '../types'

const STATUS_VALUES: RegistrationStatus[] = [
  'submitted',
  'pending',
  'approved',
  'rejected',
]

const CHANNEL_VALUES: RegistrationChannel[] = ['manual', 'self_link']

function parseStatus(value: string | null): RegistrationStatus | undefined {
  if (value && STATUS_VALUES.includes(value as RegistrationStatus)) {
    return value as RegistrationStatus
  }
  return undefined
}

function parseChannel(value: string | null): RegistrationChannel | undefined {
  if (value && CHANNEL_VALUES.includes(value as RegistrationChannel)) {
    return value as RegistrationChannel
  }
  return undefined
}

/**
 * URL-driven filters for the organizer registrations inbox / teams view
 * (?page=&status=&channel=).
 */
export function useRegistrationFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<RegistrationFilters>(() => {
    const page = Number(searchParams.get('page')) || 1
    const status = parseStatus(searchParams.get('status'))
    const channel = parseChannel(searchParams.get('channel'))
    return { page, status, channel }
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
          if ('channel' in patch) apply('channel', patch.channel)
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
