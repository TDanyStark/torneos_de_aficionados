import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/StateMessage'
import { TeamManager } from '@/features/teams/components/TeamManager'
import { useTournamentDetail } from '@/features/tournaments/api/useTournaments'

export function TeamManagePage() {
  const { slug, teamId } = useParams<{ slug: string; teamId: string }>()
  // Public detail (by slug): resolves the id + roster_limit. Works for both
  // organizers and the owner delegate; per-action authorization is enforced by
  // the team/roster endpoints. Avoids the owner-only `by-slug` admin endpoint.
  const tournament = useTournamentDetail(slug)
  const tournamentId = tournament.data?.id ?? 0
  const numericTeamId = Number(teamId)

  if (tournament.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (
    tournament.isError ||
    !tournament.data ||
    !Number.isFinite(numericTeamId) ||
    numericTeamId <= 0
  ) {
    return <ErrorState message="Equipo inválido." />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={`/t/${tournament.data.slug}`}>
          <ArrowLeft className="size-4" />
          Volver al torneo
        </Link>
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Gestión de equipo</h1>
        <p className="text-muted-foreground text-sm">
          Edita los datos del equipo y administra su plantilla.
        </p>
      </div>
      <TeamManager
        tournamentId={tournamentId}
        teamId={numericTeamId}
        rosterLimit={tournament.data.roster_limit ?? null}
        registrationOpen={tournament.data.registration_open}
      />
    </div>
  )
}
