import { Link } from 'react-router-dom'
import { Archive, ArchiveRestore, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useMe } from '@/features/auth/api/useAuth'
import { useMyOrganizerTournaments } from '@/features/tournaments/hooks/useMyOrganizerTournaments'
import { useArchivedFilter } from '@/features/tournaments/hooks/useArchivedFilter'
import { OrganizerTournamentCard } from '@/features/tournaments/components/OrganizerTournamentCard'
import { TournamentCardSkeleton } from '@/features/tournaments/components/TournamentCardSkeleton'

export function DashboardPage() {
  // Ensure /me is loaded so roles are present.
  const me = useMe()
  // Archived view is driven by the URL (?archivados=1) so it's shareable.
  const { archived, setArchived } = useArchivedFilter()
  const { tournaments, isLoading, isError } = useMyOrganizerTournaments(archived)

  const loading = me.isLoading || isLoading

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">
          {archived ? 'Torneos archivados' : 'Mis torneos'}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setArchived(!archived)}
          >
            {archived ? (
              <>
                <ArchiveRestore className="size-4" />
                Ver activos
              </>
            ) : (
              <>
                <Archive className="size-4" />
                Ver archivados
              </>
            )}
          </Button>
          {!archived ? (
            <Button asChild>
              <Link to="/tournaments/new">
                <Plus className="size-4" />
                Crear torneo
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <TournamentCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="No se pudieron cargar tus torneos." />
      ) : tournaments.length === 0 ? (
        archived ? (
          <EmptyState
            title="No tienes torneos archivados"
            description="Cuando archives un torneo, aparecerá aquí para restaurarlo o eliminarlo."
            action={
              <Button variant="outline" onClick={() => setArchived(false)}>
                <ArchiveRestore className="size-4" />
                Ver activos
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Aún no organizas torneos"
            description="Crea tu primer torneo para comenzar."
            action={
              <Button asChild>
                <Link to="/tournaments/new">
                  <Plus className="size-4" />
                  Crear torneo
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((t) => (
            <OrganizerTournamentCard
              key={t.id}
              tournament={t}
              archived={archived}
            />
          ))}
        </div>
      )}
    </div>
  )
}
