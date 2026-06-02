import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { useTournamentDetail } from '@/features/tournaments/api/useTournaments'
import { useCards } from '@/features/live/api/useStats'
import { usePageParam } from '@/features/live/hooks/usePageParam'
import { DisciplineTable } from '@/features/live/components/DisciplineTable'
import { StatsSkeleton } from '@/features/live/components/StatsSkeleton'

export function DisciplinePage() {
  const { slug } = useParams<{ slug: string }>()
  const tournament = useTournamentDetail(slug)
  const tournamentId = tournament.data?.id

  const { page, setPage } = usePageParam()
  const cards = useCards(tournamentId, page)

  const pagination = cards.data?.pagination
  const startIndex = pagination ? (pagination.page - 1) * pagination.per_page + 1 : 1

  if (tournament.isError) {
    return <ErrorState message="Torneo no encontrado." />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={`/tournaments/${slug}`}>
          <ArrowLeft className="size-4" />
          {tournament.data?.name ?? 'Torneo'}
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <ShieldAlert className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Disciplina</h1>
      </div>

      {tournament.isLoading || (tournamentId && cards.isLoading) ? (
        <StatsSkeleton />
      ) : cards.isError ? (
        <ErrorState message={cards.error?.message} />
      ) : (cards.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="Sin tarjetas"
          description="Aún no se han registrado tarjetas en este torneo."
        />
      ) : (
        <>
          <DisciplineTable
            rows={cards.data?.items ?? []}
            startIndex={startIndex}
          />
          {pagination ? (
            <Pagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              onChange={setPage}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
