import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useTournamentDetail } from '@/features/tournaments/api/useTournaments'
import { useStages } from '@/features/tournaments/api/useStages'
import { useFixtureFilters } from '@/features/fixtures/hooks/useFixtureFilters'
import { useStandings } from '@/features/fixtures/api/useStandings'
import { useTournamentGroups } from '@/features/fixtures/api/useTournamentGroups'
import { GroupSelect } from '@/features/fixtures/components/GroupSelect'
import { StandingsTable } from '@/features/fixtures/components/StandingsTable'
import { StandingsSkeleton } from '@/features/fixtures/components/StandingsSkeleton'

export function StandingsPage() {
  const { slug } = useParams<{ slug: string }>()
  const tournament = useTournamentDetail(slug)
  const tournamentId = tournament.data?.id ?? 0

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

  if (tournament.isError) {
    return <ErrorState message="Torneo no encontrado." />
  }

  const loading =
    tournament.isLoading ||
    (tournamentId > 0 && (groupsLoading || stages.isLoading))

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={`/tournaments/${slug}`}>
          <ArrowLeft className="size-4" />
          {tournament.data?.name ?? 'Torneo'}
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <ListOrdered className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Tabla de posiciones</h1>
      </div>

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
