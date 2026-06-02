import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Shuffle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/shared/StateMessage'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { apiClient } from '@/lib/apiClient'
import { useTeamList } from '@/features/teams/api/useTeams'
import type { Group, GroupTeam } from '../types'
import { useDeleteGroup, useGroups } from '../api/useGroups'
import { useDistributeGroups, groupTeamKeys } from '../api/useGroupTeams'
import { GroupCard } from './GroupCard'

interface GroupBuilderProps {
  stageId: number
  tournamentId: number
}

const MIN_GROUPS = 1
const MAX_GROUPS = 26

/**
 * Group composition manager for a "groups" stage. Provides automatic
 * round-robin distribution (which replaces existing groups) plus manual
 * per-group add / remove / move-between-groups controls.
 */
export function GroupBuilder({ stageId, tournamentId }: GroupBuilderProps) {
  const { data: groups, isLoading: groupsLoading } = useGroups(stageId)
  const distribute = useDistributeGroups(stageId)
  const deleteGroup = useDeleteGroup(stageId)

  // Approved teams are the only assignment candidates.
  const teamList = useTeamList(tournamentId, { page: 1, status: 'approved' })
  const approvedTeams = useMemo(
    () =>
      (teamList.data?.items ?? []).map((t) => ({ id: t.id, name: t.name })),
    [teamList.data],
  )

  const [count, setCount] = useState('4')
  const [random, setRandom] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDeleteGroup, setToDeleteGroup] = useState<Group | null>(null)

  // Aggregate the assigned team ids across every group so the "add team"
  // selector never offers a team already placed in the stage.
  const teamQueries = useQueries({
    queries: (groups ?? []).map((g) => ({
      queryKey: groupTeamKeys.list(g.id),
      enabled: Boolean(g.id),
      queryFn: () => apiClient.get<GroupTeam[]>(`/groups/${g.id}/teams`),
    })),
  })
  const assignedTeamIds = useMemo(() => {
    const set = new Set<number>()
    for (const q of teamQueries) {
      for (const gt of q.data ?? []) set.add(gt.tournament_team_id)
    }
    return set
  }, [teamQueries])

  const parsedCount = Number(count)
  const countValid =
    /^\d+$/.test(count) &&
    parsedCount >= MIN_GROUPS &&
    parsedCount <= MAX_GROUPS

  const runDistribute = async () => {
    setConfirmOpen(false)
    try {
      const result = await distribute.mutateAsync({
        count: parsedCount,
        random,
      })
      toast.success(
        `${result.groups_created} grupos creados · ${result.teams_distributed} equipos repartidos`,
      )
    } catch {
      toast.error('No se pudo distribuir los grupos')
    }
  }

  const onDeleteGroup = async () => {
    if (!toDeleteGroup) return
    try {
      await deleteGroup.mutateAsync(toDeleteGroup.id)
      toast.success('Grupo eliminado')
      setToDeleteGroup(null)
    } catch {
      toast.error('No se pudo eliminar el grupo')
    }
  }

  return (
    <div className="space-y-5">
      {/* Auto-distribute control */}
      <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="group-count">Cantidad de grupos</Label>
          <Input
            id="group-count"
            type="number"
            min={MIN_GROUPS}
            max={MAX_GROUPS}
            className="w-28"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="group-random"
            checked={random}
            onCheckedChange={setRandom}
            aria-label="Distribuir aleatoriamente"
          />
          <Label htmlFor="group-random">Distribuir aleatoriamente</Label>
        </div>
        <Button
          type="button"
          disabled={!countValid || distribute.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          <Shuffle className="size-4" />
          Distribuir automáticamente
        </Button>
      </div>

      {teamList.data && approvedTeams.length === 0 ? (
        <EmptyState
          title="Sin equipos aprobados"
          description="Aprueba equipos en Inscripciones para poder asignarlos a los grupos."
        />
      ) : null}

      {groupsLoading ? (
        <p className="text-muted-foreground text-sm">Cargando grupos…</p>
      ) : !groups || groups.length === 0 ? (
        <EmptyState
          title="Sin grupos"
          description="Usa la distribución automática para crear los grupos y repartir los equipos aprobados."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              stageId={stageId}
              group={group}
              approvedTeams={approvedTeams}
              assignedTeamIds={assignedTeamIds}
              otherGroups={groups.filter((g) => g.id !== group.id)}
              onDeleteGroup={setToDeleteGroup}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Distribuir grupos automáticamente"
        description="Esto reemplazará los grupos actuales y repartirá los equipos aprobados."
        confirmLabel="Distribuir"
        destructive
        loading={distribute.isPending}
        onConfirm={runDistribute}
      />

      <ConfirmDialog
        open={toDeleteGroup != null}
        onOpenChange={(open) => !open && setToDeleteGroup(null)}
        title="Eliminar grupo"
        description={
          toDeleteGroup
            ? `Se eliminará el grupo «${toDeleteGroup.name}» y sus equipos asignados.`
            : undefined
        }
        confirmLabel="Eliminar"
        destructive
        loading={deleteGroup.isPending}
        onConfirm={onDeleteGroup}
      />
    </div>
  )
}
