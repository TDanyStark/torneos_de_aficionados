import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Paginated } from '@/lib/apiTypes'
import type {
  CreateTeamPayload,
  MyTeamInTournament,
  Team,
  TeamFilters,
  UpdateTeamPayload,
  UploadTeamLogoResponse,
} from '../types'

export const teamKeys = {
  all: ['teams'] as const,
  list: (tournamentId: number, filters: TeamFilters) =>
    ['teams', 'list', tournamentId, filters] as const,
  detail: (teamId: number) => ['teams', 'detail', teamId] as const,
}

/** Public, paginated team list for a tournament with URL-driven filters. */
export function useTeamList(tournamentId: number, filters: TeamFilters) {
  return useQuery({
    queryKey: teamKeys.list(tournamentId, filters),
    enabled: Number.isFinite(tournamentId) && tournamentId > 0,
    queryFn: ({ signal }) =>
      apiClient.getPaginated<Team>(
        `/tournaments/${tournamentId}/teams`,
        {
          page: filters.page,
          q: filters.q,
          status: filters.status,
        },
        signal,
      ),
    placeholderData: (prev) => prev as Paginated<Team> | undefined,
  })
}

/**
 * Public team detail. There is no dedicated GET /tournament-teams/{id}, so we
 * resolve a single team from the paginated tournament list. Falls back to
 * undefined when the team is not on the requested page.
 */
export function useTeam(tournamentId: number, teamId: number) {
  return useQuery({
    queryKey: teamKeys.detail(teamId),
    enabled:
      Number.isFinite(tournamentId) &&
      tournamentId > 0 &&
      Number.isFinite(teamId) &&
      teamId > 0,
    queryFn: async ({ signal }) => {
      const res = await apiClient.getPaginated<Team>(
        `/tournaments/${tournamentId}/teams`,
        { per_page: 100 },
        signal,
      )
      return res.items.find((t) => t.id === teamId) ?? null
    },
  })
}

export function useCreateTeam(tournamentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) =>
      apiClient.post<Team>(`/tournaments/${tournamentId}/teams`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

export function useUpdateTeam(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTeamPayload) =>
      apiClient.put<Team>(`/tournament-teams/${teamId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all })
      qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) })
    },
  })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (teamId: number) =>
      apiClient.delete(`/tournament-teams/${teamId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

/**
 * Management team-logo upload (organizer|owner delegate). Posts multipart `file`;
 * the backend crops to 398x398, persists logo_url and returns it.
 */
export function useUploadTeamLogo(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.postForm<UploadTeamLogoResponse>(
        `/tournament-teams/${teamId}/logo`,
        formData,
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all })
      qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) })
    },
  })
}

/**
 * Whether the current user already enrolled a team (as delegate) in this
 * tournament. Returns null when they have none. Disabled without a session.
 */
export function useMyTeam(tournamentId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['teams', 'my-team', tournamentId ?? 0] as const,
    enabled: enabled && Number.isFinite(tournamentId) && Number(tournamentId) > 0,
    queryFn: ({ signal }) =>
      apiClient.get<MyTeamInTournament | null>(
        `/tournaments/${tournamentId}/my-team`,
        undefined,
        signal,
      ),
  })
}
