import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useMe } from '@/features/auth/api/useAuth'
import { useMyOrganizerTournaments } from '@/features/tournaments/hooks/useMyOrganizerTournaments'
import { OrganizerTournamentCard } from '@/features/tournaments/components/OrganizerTournamentCard'
import { TournamentCardSkeleton } from '@/features/tournaments/components/TournamentCardSkeleton'

export function DashboardPage() {
  // Ensure /me is loaded so roles are present.
  const me = useMe()
  const { tournaments, isLoading, isError } = useMyOrganizerTournaments()

  const loading = me.isLoading || isLoading

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Mis torneos</h1>
        <Button asChild>
          <Link to="/tournaments/new">
            <Plus className="size-4" />
            Crear torneo
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <TournamentCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="No se pudieron cargar tus torneos." />
      ) : tournaments.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <OrganizerTournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  )
}
