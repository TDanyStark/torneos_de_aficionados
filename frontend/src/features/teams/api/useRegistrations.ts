import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Paginated } from '@/lib/apiTypes'
import { teamKeys } from './useTeams'
import type {
  CreateRegistrationPayload,
  Registration,
  RegistrationDecisionResult,
  RegistrationFilters,
  RegistrationStatus,
} from '../types'

export const registrationKeys = {
  all: ['registrations'] as const,
  list: (tournamentId: number, filters: RegistrationFilters) =>
    ['registrations', 'list', tournamentId, filters] as const,
}

/** Organizer inbox — paginated, pending-first (backend ordered). */
export function useRegistrations(
  tournamentId: number,
  filters: RegistrationFilters,
) {
  return useQuery({
    queryKey: registrationKeys.list(tournamentId, filters),
    enabled: Number.isFinite(tournamentId) && tournamentId > 0,
    queryFn: ({ signal }) =>
      apiClient.getPaginated<Registration>(
        `/tournaments/${tournamentId}/registrations`,
        { page: filters.page, status: filters.status },
        signal,
      ),
    placeholderData: (prev) => prev as Paginated<Registration> | undefined,
  })
}

/**
 * Public self-registration (POST /tournaments/{id}/registrations). The
 * registration_code in the body is validated by the backend against the
 * tournament resolved from {id}.
 */
export function useCreateRegistration(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRegistrationPayload) =>
      apiClient.post<Registration>(
        `/tournaments/${tournamentId}/registrations`,
        payload,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.all })
    },
  })
}

/** Organizer approve/reject decision. */
export function useDecideRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      registrationId,
      status,
    }: {
      registrationId: number
      status: Extract<RegistrationStatus, 'approved' | 'rejected'>
    }) =>
      apiClient.patch<RegistrationDecisionResult>(
        `/registrations/${registrationId}`,
        { status },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.all })
      // The decision flips the team's status too.
      qc.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}
