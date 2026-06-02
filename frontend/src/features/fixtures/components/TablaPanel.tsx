import { useEffect } from 'react'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useStages } from '@/features/tournaments/api/useStages'
import { useFixtureFilters } from '@/features/fixtures/hooks/useFixtureFilters'
import { useStandings } from '@/features/fixtures/api/useStandings'
import { useTournamentGroups } from '@/features/fixtures/api/useTournamentGroups'
import { GroupSelect } from '@/features/fixtures/components/GroupSelect'
import { StandingsTable } from '@/features/fixtures/components/StandingsTable'
import { StandingsSkeleton } from '@/features/fixtures/components/StandingsSkeleton'
import type { Tournament } from '@/features/tournaments/types'

interface TablaPanelProps {
  tournament: Tournament
}

/**
 * Standings panel for the tournament hub — extracted verbatim from the legacy
 * StandingsPage body (group select + StandingsTable with tiebreakers).
 */
export function TablaPanel({ tournament }: TablaPanelProps) {
  const tournamentId = tournament.id

  const { filters, setFilters } = useFixtureFilters()
  const stages = useStages(tournamentId || undefined)
  const { groups, isLoading: groupsLoading } = useTournamentGroups(stages.data)

  // Default the selected group to the first available one.
  const activeGroupId =
    filters.group ?? (groups.length > 0 ? groups[0].id : undefined)

  useEffect(() => {
    if (!filters.group && groups.length > 0) {
      setFilters({ group: groups[0].id })
    }
  }, [filters.group, groups, setFilters])

  const standings = useStandings(activeGroupId)

  const loading = groupsLoading || stages.isLoading

  return (
    <div className="space-y-5">
      {groups.length > 0 ? (
        <GroupSelect
          groups={groups}
          value={activeGroupId}
          clearable={false}
          onChange={(group) => setFilters({ group })}
        />
      ) : null}

      {loading ? (
        <StandingsSkeleton />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Sin grupos"
          description="Aún no se han configurado grupos en este torneo."
        />
      ) : standings.isLoading ? (
        <StandingsSkeleton />
      ) : standings.isError ? (
        <ErrorState message={standings.error?.message} />
      ) : !standings.data || standings.data.standings.length === 0 ? (
        <EmptyState
          title="Tabla vacía"
          description="Aún no hay resultados para calcular la tabla de este grupo."
        />
      ) : (
        <StandingsTable rows={standings.data.standings} />
      )}
    </div>
  )
}
