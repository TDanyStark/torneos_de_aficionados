import { useState } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ErrorState } from '@/components/shared/StateMessage'
import { useTeam } from '../api/useTeams'
import {
  useRoster,
  useDeleteTeamPlayer,
} from '../api/useRoster'
import { TeamEditForm } from './TeamEditForm'
import { RosterTable } from './RosterTable'
import { AddPlayerForm } from './AddPlayerForm'

interface TeamManagerProps {
  tournamentId: number
  teamId: number
}

/** Organizer/delegate management surface: edit team + roster CRUD. */
export function TeamManager({ tournamentId, teamId }: TeamManagerProps) {
  const teamQuery = useTeam(tournamentId, teamId)
  const roster = useRoster(teamId)
  const deleteTeamPlayer = useDeleteTeamPlayer(teamId)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const onRemovePlayer = async (teamPlayerId: number) => {
    setRemovingId(teamPlayerId)
    try {
      await deleteTeamPlayer.mutateAsync(teamPlayerId)
      toast.success('Jugador retirado de la plantilla')
    } catch {
      toast.error('No se pudo retirar el jugador')
    } finally {
      setRemovingId(null)
    }
  }

  if (teamQuery.isError) {
    return <ErrorState message="No se pudo cargar el equipo." />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          {teamQuery.data ? (
            <TeamEditForm team={teamQuery.data} />
          ) : (
            <p className="text-muted-foreground text-sm">Cargando equipo…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plantilla</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddPlayerForm tournamentId={tournamentId} teamId={teamId} />
          {roster.isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando plantilla…</p>
          ) : roster.isError ? (
            <ErrorState message="No se pudo cargar la plantilla." />
          ) : (
            <RosterTable
              players={roster.data ?? []}
              onRemove={onRemovePlayer}
              removingId={removingId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
