import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  AddPlayerPayload,
  TeamPlayer,
  UpdateTeamPlayerPayload,
  UploadTeamPlayerPhotoResponse,
} from '../types'

export const rosterKeys = {
  list: (teamId: number) => ['teams', teamId, 'roster'] as const,
}

/** Public roster of a team. */
export function useRoster(teamId: number | undefined) {
  return useQuery({
    queryKey: rosterKeys.list(teamId ?? 0),
    enabled: Boolean(teamId) && Number(teamId) > 0,
    queryFn: ({ signal }) =>
      apiClient.get<TeamPlayer[]>(
        `/tournament-teams/${teamId}/players`,
        undefined,
        signal,
      ),
  })
}

/**
 * Single roster entry, resolved from the roster list (the backend exposes no
 * single-player GET). Reuses the cached list so navigating from the roster to
 * the per-player edit page is instant.
 */
export function useTeamPlayer(
  teamId: number | undefined,
  teamPlayerId: number,
) {
  const roster = useRoster(teamId)
  const player = roster.data?.find((p) => p.id === teamPlayerId) ?? null
  return { ...roster, player }
}

/** Adds a player to the roster (reuses by cédula or creates a new player). */
export function useAddPlayer(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddPlayerPayload) =>
      apiClient.post<TeamPlayer>(
        `/tournament-teams/${teamId}/players`,
        payload,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rosterKeys.list(teamId) })
    },
  })
}

export function useUpdateTeamPlayer(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamPlayerId,
      payload,
    }: {
      teamPlayerId: number
      payload: UpdateTeamPlayerPayload
    }) => apiClient.put<TeamPlayer>(`/team-players/${teamPlayerId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rosterKeys.list(teamId) })
    },
  })
}

export function useDeleteTeamPlayer(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (teamPlayerId: number) =>
      apiClient.delete(`/team-players/${teamPlayerId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rosterKeys.list(teamId) })
    },
  })
}

/**
 * Management player-photo upload (organizer|owner delegate). Posts multipart
 * `file` to the roster entry; the backend crops to 398x398, persists the
 * player's photo_url and returns it.
 */
export function useUploadTeamPlayerPhoto(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamPlayerId,
      file,
    }: {
      teamPlayerId: number
      file: File
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.postForm<UploadTeamPlayerPhotoResponse>(
        `/team-players/${teamPlayerId}/photo`,
        formData,
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rosterKeys.list(teamId) })
    },
  })
}
