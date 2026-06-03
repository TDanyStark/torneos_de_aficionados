import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Lock, Trash2, UserPlus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/StateMessage'
import { useAuthStore } from '@/stores/authStore'
import {
  useTeam,
  useTeamDeletionImpact,
  useDeleteTeam,
} from '../api/useTeams'
import { useRoster } from '../api/useRoster'
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
  /** Tournament slug, used to redirect to the teams panel after deletion. */
  tournamentSlug?: string
}

/** Organizer/delegate management surface: edit team + roster CRUD. */
export function TeamManager({
  tournamentId,
  teamId,
  rosterLimit = null,
  registrationOpen = true,
  tournamentSlug,
}: TeamManagerProps) {
  const navigate = useNavigate()
  const teamQuery = useTeam(tournamentId, teamId)
  const roster = useRoster(teamId)
  const deleteTeam = useDeleteTeam()
  const [addOpen, setAddOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const deletionImpact = useTeamDeletionImpact(teamId, confirmDeleteOpen)

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
  const isRosterFull = rosterLimit != null && currentCount >= rosterLimit

  const onDeleteTeam = async () => {
    try {
      await deleteTeam.mutateAsync(teamId)
      toast.success('Equipo eliminado')
      setConfirmDeleteOpen(false)
      if (tournamentSlug) {
        navigate(`/t/${tournamentSlug}?tab=equipos`)
      }
    } catch {
      toast.error('No se pudo eliminar el equipo')
    }
  }

  // Human-readable summary of what deletion will destroy. Loaded lazily when the
  // confirm dialog opens; until then we show a neutral placeholder.
  const impact = deletionImpact.data?.impact
  const deletionDescription = deletionImpact.isLoading
    ? 'Calculando lo que se eliminará…'
    : impact
      ? buildDeletionWarning(impact)
      : 'Se eliminará el equipo y toda su información asociada. Esta acción no se puede deshacer.'

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
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Plantilla</CardTitle>
            {canEdit ? (
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={isRosterFull}>
                    <UserPlus className="size-4" />
                    {isRosterFull
                      ? `Plantilla llena (${currentCount}/${rosterLimit})`
                      : 'Agregar jugador'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Agregar jugador</DialogTitle>
                    <DialogDescription>
                      Busca por cédula para reutilizar un jugador existente o
                      registra uno nuevo.
                    </DialogDescription>
                  </DialogHeader>
                  <AddPlayerForm
                    tournamentId={tournamentId}
                    teamId={teamId}
                    rosterLimit={rosterLimit}
                    currentCount={currentCount}
                    onSuccess={() => setAddOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {roster.isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando plantilla…</p>
          ) : roster.isError ? (
            <ErrorState message="No se pudo cargar la plantilla." />
          ) : (
            <RosterTable
              players={roster.data ?? []}
              teamId={teamId}
              tournamentSlug={tournamentSlug}
              canModerate={isOrganizer}
              canEdit={canEdit}
            />
          )}
        </CardContent>
      </Card>

      {/* Danger zone — organizer only. Deleting purges matches + goals. */}
      {isOrganizer ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de peligro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Eliminar el equipo lo quita del torneo junto con sus partidos,
              goleadores y demás datos asociados. Esta acción no se puede
              deshacer.
            </p>
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Eliminar equipo
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Eliminar este equipo?"
        description={deletionDescription}
        confirmLabel="Sí, eliminar equipo"
        cancelLabel="Cancelar"
        destructive
        loading={deleteTeam.isPending}
        onConfirm={onDeleteTeam}
      />
    </div>
  )
}

/**
 * Builds the destructive-action warning sentence from the deletion impact
 * counts so the organizer knows exactly what will be removed.
 */
function buildDeletionWarning(impact: {
  players: number
  matches: number
  goals: number
}): string {
  const parts: string[] = []
  if (impact.matches > 0) {
    parts.push(
      `${impact.matches} ${impact.matches === 1 ? 'partido' : 'partidos'}`,
    )
  }
  if (impact.goals > 0) {
    parts.push(`${impact.goals} ${impact.goals === 1 ? 'gol' : 'goles'}`)
  }
  if (impact.players > 0) {
    parts.push(
      `${impact.players} ${impact.players === 1 ? 'jugador' : 'jugadores'} en la plantilla`,
    )
  }

  if (parts.length === 0) {
    return 'Se eliminará el equipo. No tiene partidos ni goles registrados. Esta acción no se puede deshacer.'
  }

  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`

  return `Se eliminarán también ${list}. Esta acción no se puede deshacer.`
}
