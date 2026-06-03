import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/StateMessage'
import { TeamManager } from '@/features/teams/components/TeamManager'
import { useTournamentBySlug } from '@/features/tournaments/api/useTournaments'

export function TeamManagePage() {
  const { slug, teamId } = useParams<{ slug: string; teamId: string }>()
  const tournament = useTournamentBySlug(slug)
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
        <Link to={`/t/${tournament.data.slug}/registrations`}>
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Gestión de equipo</h1>
        <p className="text-muted-foreground text-sm">
          Edita los datos del equipo y administra su plantilla.
        </p>
      </div>
      <TeamManager tournamentId={tournamentId} teamId={numericTeamId} />
    </div>
  )
}
