import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Sport } from '../types'

export const sportsKeys = {
  all: ['sports'] as const,
}

/** Loads the catalog of sports for the create-tournament wizard select. */
export function useSports() {
  return useQuery({
    queryKey: sportsKeys.all,
    staleTime: 10 * 60_000,
    queryFn: () => apiClient.get<Sport[]>('/sports'),
  })
}
