import { useState } from 'react'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ErrorState } from '@/components/shared/StateMessage'
import { useAuthStore } from '@/stores/authStore'
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
  /** Tournament roster cap (null = unlimited). Resolved by the parent page. */
  rosterLimit?: number | null
  /** Whether registrations are still open (gates delegate edits). */
  registrationOpen?: boolean
}

/** Organizer/delegate management surface: edit team + roster CRUD. */
export function TeamManager({
  tournamentId,
  teamId,
  rosterLimit = null,
  registrationOpen = true,
}: TeamManagerProps) {
  const teamQuery = useTeam(tournamentId, teamId)
  const roster = useRoster(teamId)
  const deleteTeamPlayer = useDeleteTeamPlayer(teamId)
  const [removingId, setRemovingId] = useState<number | null>(null)

  // Per-tournament organizer role. Organizers moderate players (reject/re-accept);
  // both organizer and the owner delegate can edit roster data + photos.
  const isOrganizer = useAuthStore((s) =>
    s.roles.some(
      (r) => r.tournament_id === tournamentId && r.role === 'organizer',
    ),
  )

  // Once registrations close, only the organizer may edit. Delegates get a
  // read-only view with a clear notice.
  const canEdit = isOrganizer || registrationOpen

  const currentCount = roster.data?.length ?? 0

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
      {!canEdit ? (
        <div className="bg-muted/50 text-muted-foreground flex items-start gap-3 rounded-md border p-3 text-sm">
          <Lock className="text-brand mt-0.5 size-4 shrink-0" />
          <p>
            Las inscripciones están cerradas. Ya no puedes editar el equipo ni
            la plantilla; solo el organizador puede hacer cambios.
          </p>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Datos del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          {teamQuery.data ? (
            <TeamEditForm team={teamQuery.data} readOnly={!canEdit} />
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
          {canEdit ? (
            <AddPlayerForm
              tournamentId={tournamentId}
              teamId={teamId}
              rosterLimit={rosterLimit}
              currentCount={currentCount}
            />
          ) : null}
          {roster.isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando plantilla…</p>
          ) : roster.isError ? (
            <ErrorState message="No se pudo cargar la plantilla." />
          ) : (
            <RosterTable
              players={roster.data ?? []}
              teamId={teamId}
              canModerate={isOrganizer}
              canEdit={canEdit}
              canViewHistory={isOrganizer}
              onRemove={canEdit ? onRemovePlayer : undefined}
              removingId={removingId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
