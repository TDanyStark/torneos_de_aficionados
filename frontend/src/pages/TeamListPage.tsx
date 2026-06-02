import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { useTournamentDetail } from '@/features/tournaments/api/useTournaments'
import { useTeamList } from '@/features/teams/api/useTeams'
import { useTeamFilters } from '@/features/teams/hooks/useTeamFilters'
import { TeamCard } from '@/features/teams/components/TeamCard'
import { TeamCardSkeleton } from '@/features/teams/components/TeamCardSkeleton'
import { TeamFilterBar } from '@/features/teams/components/TeamFilterBar'

export function TeamListPage() {
  const { slug } = useParams<{ slug: string }>()
  const tournament = useTournamentDetail(slug)
  const tournamentId = tournament.data?.id ?? 0
  const { filters, setFilters } = useTeamFilters()
  const { data, isLoading, isError, error } = useTeamList(tournamentId, filters)

  const loading = tournament.isLoading || (tournamentId > 0 && isLoading)

  if (tournament.isError) {
    return <ErrorState message="Torneo no encontrado." />
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={`/tournaments/${slug}`}>
          <ArrowLeft className="size-4" />
          {tournament.data?.name ?? 'Torneo'}
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <Users className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Equipos</h1>
      </div>

      <TeamFilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                tournamentSlug={slug ?? ''}
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
