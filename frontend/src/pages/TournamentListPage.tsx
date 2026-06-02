import { Trophy } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { useTournamentList } from '@/features/tournaments/api/useTournaments'
import { useTournamentFilters } from '@/features/tournaments/hooks/useTournamentFilters'
import { TournamentCard } from '@/features/tournaments/components/TournamentCard'
import { TournamentCardSkeleton } from '@/features/tournaments/components/TournamentCardSkeleton'
import { TournamentFilterBar } from '@/features/tournaments/components/TournamentFilterBar'
import { OrganizerCta } from '@/features/tournaments/components/OrganizerCta'

export function TournamentListPage() {
  const { filters, setFilters } = useTournamentFilters()
  const { data, isLoading, isError, error } = useTournamentList(filters)

  return (
    <div className="space-y-5">
      <OrganizerCta />

      <div className="flex items-center gap-2">
        <Trophy className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Torneos</h1>
      </div>

      <TournamentFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TournamentCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error.message} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No hay torneos"
          description="Ajusta los filtros o vuelve más tarde."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
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
