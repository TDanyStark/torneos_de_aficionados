import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import type { Group } from '../types'
import {
  useAssignTeam,
  useGroupTeams,
  useRemoveTeam,
} from '../api/useGroupTeams'

interface AssignableTeam {
  id: number
  name: string
}

interface GroupCardProps {
  stageId: number
  group: Group
  /** Approved teams for the tournament (assignment candidates). */
  approvedTeams: AssignableTeam[]
  /** tournament_team_ids already assigned across ALL groups in the stage. */
  assignedTeamIds: ReadonlySet<number>
  /** Other groups in the stage (move-to targets). */
  otherGroups: Group[]
  onDeleteGroup: (group: Group) => void
}

/**
 * A single group: its assigned teams (with remove + move-to controls) and an
 * "add team" selector limited to approved, not-yet-assigned teams. Moving a
 * team is implemented as remove-from-source then add-to-target (sequenced).
 */
export function GroupCard({
  stageId,
  group,
  approvedTeams,
  assignedTeamIds,
  otherGroups,
  onDeleteGroup,
}: GroupCardProps) {
  const { data: teams, isLoading } = useGroupTeams(group.id)
  const assignTeam = useAssignTeam(stageId)
  const removeTeam = useRemoveTeam(stageId)

  const [busy, setBusy] = useState(false)

  // Add-team options: approved teams not assigned anywhere in the stage.
  const addOptions: SelectOption<number>[] = approvedTeams
    .filter((t) => !assignedTeamIds.has(t.id))
    .map((t) => ({ value: t.id, label: t.name }))

  const moveOptions: SelectOption<number>[] = otherGroups.map((g) => ({
    value: g.id,
    label: g.name,
  }))

  const handleAdd = async (teamId: number | undefined) => {
    if (teamId == null) return
    setBusy(true)
    try {
      await assignTeam.mutateAsync({
        groupId: group.id,
        payload: { tournament_team_id: teamId },
      })
      toast.success('Equipo agregado')
    } catch {
      toast.error('No se pudo agregar el equipo')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (groupTeamId: number) => {
    setBusy(true)
    try {
      await removeTeam.mutateAsync({ groupTeamId, groupId: group.id })
      toast.success('Equipo quitado')
    } catch {
      toast.error('No se pudo quitar el equipo')
    } finally {
      setBusy(false)
    }
  }

  const handleMove = async (
    groupTeamId: number,
    tournamentTeamId: number,
    targetGroupId: number | undefined,
  ) => {
    if (targetGroupId == null) return
    setBusy(true)
    try {
      await removeTeam.mutateAsync({ groupTeamId, groupId: group.id })
      await assignTeam.mutateAsync({
        groupId: targetGroupId,
        payload: { tournament_team_id: tournamentTeamId },
      })
      toast.success('Equipo movido')
    } catch {
      toast.error('No se pudo mover el equipo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{group.name}</h4>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDeleteGroup(group)}
          aria-label={`Eliminar ${group.name}`}
        >
          <Trash2 className="text-destructive size-4" />
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando equipos…</p>
      ) : !teams || teams.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sin equipos asignados.</p>
      ) : (
        <ul className="space-y-2">
          {teams.map((gt) => (
            <li
              key={gt.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
            >
              <span className="text-sm font-medium">
                {gt.team_name ?? `Equipo #${gt.tournament_team_id}`}
              </span>
              <div className="flex items-center gap-2">
                {moveOptions.length > 0 ? (
                  <div className="w-40">
                    <ReactSelect<SelectOption<number>>
                      isDisabled={busy}
                      placeholder="Mover a…"
                      options={moveOptions}
                      value={null}
                      onChange={(opt) =>
                        handleMove(gt.id, gt.tournament_team_id, opt?.value)
                      }
                    />
                  </div>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={busy}
                  onClick={() => handleRemove(gt.id)}
                  aria-label="Quitar equipo"
                >
                  <X className="text-destructive size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <label className="text-muted-foreground mb-1 block text-xs font-medium">
          Agregar equipo
        </label>
        <ReactSelect<SelectOption<number>>
          isDisabled={busy || addOptions.length === 0}
          placeholder={
            addOptions.length === 0
              ? 'No hay equipos disponibles'
              : 'Selecciona un equipo'
          }
          options={addOptions}
          value={null}
          onChange={(opt) => handleAdd(opt?.value)}
        />
      </div>
    </div>
  )
}
