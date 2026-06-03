import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ApiError } from '@/lib/apiClient'
import { teamKeys, useDeleteTeam, useTeamDeletionImpact } from '../api/useTeams'
import { registrationKeys } from '../api/useRegistrations'

interface DeleteTeamDialogProps {
  /** Tournament-team id to delete. */
  teamId: number
  /** Team name, surfaced in the dialog title. */
  teamName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful deletion (e.g. to clear local selection). */
  onDeleted?: () => void
}

/**
 * Reusable confirm dialog for deleting a tournament team. Lazily loads the
 * deletion-impact preview (matches/goals/players) when opened, then deletes via
 * DELETE /tournament-teams/{id}. Used by the admin teams panel and the public
 * league list (organizer-only).
 */
export function DeleteTeamDialog({
  teamId,
  teamName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteTeamDialogProps) {
  const qc = useQueryClient()
  const deleteTeam = useDeleteTeam()
  const deletionImpact = useTeamDeletionImpact(teamId, open)

  const impact = deletionImpact.data?.impact
  const description = deletionImpact.isLoading
    ? 'Calculando lo que se eliminará…'
    : impact
      ? buildDeletionWarning(impact)
      : 'Se eliminará el equipo y toda su información asociada. Esta acción no se puede deshacer.'

  const onConfirm = async () => {
    try {
      await deleteTeam.mutateAsync(teamId)
      toast.success('Equipo eliminado')
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      // The team was already deleted (stale row): treat it as success and
      // refresh the lists so the phantom row disappears.
      if (error instanceof ApiError && error.status === 404) {
        qc.invalidateQueries({ queryKey: teamKeys.all })
        qc.invalidateQueries({ queryKey: registrationKeys.all })
        toast.success('El equipo ya había sido eliminado')
        onOpenChange(false)
        onDeleted?.()
        return
      }
      toast.error('No se pudo eliminar el equipo')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={teamName ? `Eliminar ${teamName}` : 'Eliminar equipo'}
      description={description}
      confirmLabel="Eliminar"
      destructive
      loading={deleteTeam.isPending}
      onConfirm={onConfirm}
    />
  )
}

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
