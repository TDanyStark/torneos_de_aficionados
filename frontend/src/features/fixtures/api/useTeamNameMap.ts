import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Team } from '@/features/teams/types'

export const teamNameMapKeys = {
  byTournament: (tournamentId: number) =>
    ['teams', 'name-map', tournamentId] as const,
}

/**
 * Loads every team of a tournament and exposes a `teamId → name` lookup.
 *
 * Matches return team IDs (not names), so the calendar/bracket views resolve
 * display names through this map. We page large (per_page=100) because a
 * tournament's team count is bounded and this is a single read.
 */
export function useTeamNameMap(tournamentId: number | undefined) {
  const query = useQuery({
    queryKey: teamNameMapKeys.byTournament(tournamentId ?? 0),
    enabled: Boolean(tournamentId),
    queryFn: async ({ signal }) => {
      const res = await apiClient.getPaginated<Team>(
        `/tournaments/${tournamentId}/teams`,
        { per_page: 100 },
        signal,
      )
      return res.items
    },
  })

  const map = useMemo(() => {
    const m = new Map<number, string>()
    for (const team of query.data ?? []) {
      m.set(team.id, team.short_name?.trim() || team.name)
    }
    return m
  }, [query.data])

  /** Resolve a team name, falling back to a neutral placeholder. */
  const nameOf = (teamId: number | null | undefined): string => {
    if (teamId == null) return 'Por definir'
    return map.get(teamId) ?? `Equipo #${teamId}`
  }

  return { map, nameOf, isLoading: query.isLoading, isError: query.isError }
}
