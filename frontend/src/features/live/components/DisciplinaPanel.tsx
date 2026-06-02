import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { useCards } from '@/features/live/api/useStats'
import { usePageParam } from '@/features/live/hooks/usePageParam'
import { DisciplineTable } from '@/features/live/components/DisciplineTable'
import { StatsSkeleton } from '@/features/live/components/StatsSkeleton'
import type { Tournament } from '@/features/tournaments/types'

interface DisciplinaPanelProps {
  tournament: Tournament
}

/**
 * Discipline (cards) panel for the tournament hub — extracted verbatim from the
 * legacy DisciplinePage body (paginated DisciplineTable).
 */
export function DisciplinaPanel({ tournament }: DisciplinaPanelProps) {
  const tournamentId = tournament.id

  const { page, setPage } = usePageParam()
  const cards = useCards(tournamentId, page)

  const pagination = cards.data?.pagination
  const startIndex = pagination
    ? (pagination.page - 1) * pagination.per_page + 1
    : 1

  return (
    <div className="space-y-5">
      {cards.isLoading ? (
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
