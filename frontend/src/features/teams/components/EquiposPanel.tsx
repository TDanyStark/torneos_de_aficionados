import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { useTeamList } from '@/features/teams/api/useTeams'
import { useTeamFilters } from '@/features/teams/hooks/useTeamFilters'
import { TeamCard } from '@/features/teams/components/TeamCard'
import { TeamCardSkeleton } from '@/features/teams/components/TeamCardSkeleton'
import { TeamFilterBar } from '@/features/teams/components/TeamFilterBar'
import type { Tournament } from '@/features/tournaments/types'

interface EquiposPanelProps {
  tournament: Tournament
}

/**
 * Teams grid panel for the tournament hub — extracted verbatim from the legacy
 * TeamListPage body (filters + paginated grid). TeamCard links resolve to the
 * new canonical team-detail path `/t/:slug/equipo/:teamId`.
 */
export function EquiposPanel({ tournament }: EquiposPanelProps) {
  const tournamentId = tournament.id
  const { filters, setFilters } = useTeamFilters()
  const { data, isLoading, isError, error } = useTeamList(tournamentId, filters)

  return (
    <div className="space-y-5">
      <TeamFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No hay equipos"
          description="Aún no se han registrado equipos en este torneo."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.items.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                tournamentSlug={tournament.slug}
                tournamentId={tournament.id}
              />
            ))}
          </div>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.total_pages}
            onChange={(page) => setFilters({ page })}
          />
        </>
      )}
    </div>
  )
}
