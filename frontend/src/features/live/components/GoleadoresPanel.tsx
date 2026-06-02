import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { useTopScorers } from '@/features/live/api/useStats'
import { usePageParam } from '@/features/live/hooks/usePageParam'
import { TopScorersTable } from '@/features/live/components/TopScorersTable'
import { StatsSkeleton } from '@/features/live/components/StatsSkeleton'
import type { Tournament } from '@/features/tournaments/types'

interface GoleadoresPanelProps {
  tournament: Tournament
}

/**
 * Top-scorers panel for the tournament hub — extracted verbatim from the legacy
 * TopScorersPage body (paginated TopScorersTable).
 */
export function GoleadoresPanel({ tournament }: GoleadoresPanelProps) {
  const tournamentId = tournament.id

  const { page, setPage } = usePageParam()
  const scorers = useTopScorers(tournamentId, page)

  const pagination = scorers.data?.pagination
  const startIndex = pagination
    ? (pagination.page - 1) * pagination.per_page + 1
    : 1

  return (
    <div className="space-y-5">
      {scorers.isLoading ? (
        <StatsSkeleton />
      ) : scorers.isError ? (
        <ErrorState message={scorers.error?.message} />
      ) : (scorers.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="Sin goleadores"
          description="Aún no se han registrado goles en este torneo."
        />
      ) : (
        <>
          <TopScorersTable
            rows={scorers.data?.items ?? []}
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
