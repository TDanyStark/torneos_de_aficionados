import { useState } from 'react'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeamList } from '@/features/teams/api/useTeams'
import { useTeamFilters } from '@/features/teams/hooks/useTeamFilters'
import { TeamLeagueRow } from '@/features/teams/components/TeamLeagueRow'
import { TeamFilterBar } from '@/features/teams/components/TeamFilterBar'
import { DeleteTeamDialog } from '@/features/teams/components/DeleteTeamDialog'
import type { Tournament } from '@/features/tournaments/types'
import type { Team } from '@/features/teams/types'

interface EquiposPanelProps {
  tournament: Tournament
}

/**
 * Teams panel for the public tournament hub. Renders a league-style list (rows,
 * not cards): crest + name + status, linking to the team's FIFA-card roster.
 * Organizers also get an inline delete action per row (with an impact-aware
 * confirm dialog).
 */
export function EquiposPanel({ tournament }: EquiposPanelProps) {
  const tournamentId = tournament.id
  const { filters, setFilters } = useTeamFilters()
  const { data, isLoading, isError, error } = useTeamList(tournamentId, filters)
  const [toDelete, setToDelete] = useState<Team | null>(null)

  return (
    <div className="space-y-5">
      <TeamFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="space-y-2 rounded-md border p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
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
          <ul className="divide-y rounded-md border">
            {data.items.map((team) => (
              <TeamLeagueRow
                key={team.id}
                team={team}
                tournamentSlug={tournament.slug}
                tournamentId={tournament.id}
                onDelete={setToDelete}
              />
            ))}
          </ul>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.total_pages}
            onChange={(page) => setFilters({ page })}
          />
        </>
      )}

      <DeleteTeamDialog
        teamId={toDelete?.id ?? 0}
        teamName={toDelete?.name}
        open={toDelete != null}
        onOpenChange={(next) => {
          if (!next) setToDelete(null)
        }}
        onDeleted={() => setToDelete(null)}
      />
    </div>
  )
}
