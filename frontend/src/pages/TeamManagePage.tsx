import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/StateMessage'
import { TeamManager } from '@/features/teams/components/TeamManager'

export function TeamManagePage() {
  const { id, teamId } = useParams<{ id: string; teamId: string }>()
  const tournamentId = Number(id)
  const numericTeamId = Number(teamId)

  if (
    !Number.isFinite(tournamentId) ||
    tournamentId <= 0 ||
    !Number.isFinite(numericTeamId) ||
    numericTeamId <= 0
  ) {
    return <ErrorState message="Equipo inválido." />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={`/tournaments/${tournamentId}/registrations`}>
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
