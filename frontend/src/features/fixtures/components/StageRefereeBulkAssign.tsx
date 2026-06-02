import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import { ApiError } from '@/lib/apiClient'
import type { Referee } from '@/features/tournaments/types'
import { useAssignStageReferee } from '@/features/tournaments/api/useReferees'
import type { Round } from '../types'

interface StageRefereeBulkAssignProps {
  tournamentId: number
  stageId: number
  referees: Referee[]
  /** Rounds of this stage — enables the optional per-round scope. */
  rounds: Round[]
}

/**
 * Organizer bulk action ("en bucle"): assign the same referee to every match
 * of the stage, or scope it to a single round. Clearing the referee select and
 * applying clears the assignment (`referee_id: null`). After success a toast
 * reports how many matches were updated and fixtures invalidate so the
 * per-match selects reflect the change.
 */
export function StageRefereeBulkAssign({
  tournamentId,
  stageId,
  referees,
  rounds,
}: StageRefereeBulkAssignProps) {
  const assignStage = useAssignStageReferee(tournamentId)

  const [refereeId, setRefereeId] = useState<number | null>(null)
  const [roundId, setRoundId] = useState<number | null>(null)

  const refereeOptions: SelectOption<number>[] = referees.map((r) => ({
    value: r.id,
    label: r.name,
  }))
  const selectedReferee =
    refereeOptions.find((o) => o.value === refereeId) ?? null

  const roundOptions: SelectOption<number>[] = rounds.map((r) => ({
    value: r.id,
    label: r.name?.trim() || `Fecha ${r.number}`,
  }))
  const selectedRound = roundOptions.find((o) => o.value === roundId) ?? null

  const onApply = async () => {
    try {
      const result = await assignStage.mutateAsync({
        stageId,
        referee_id: refereeId,
        round_id: roundId,
      })
      toast.success(
        refereeId == null
          ? `Árbitro quitado de ${result.matches_updated} partido(s)`
          : `Árbitro asignado a ${result.matches_updated} partido(s)`,
      )
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo asignar el árbitro',
      )
    }
  }

  return (
    <div className="bg-muted/40 flex flex-wrap items-end gap-2 rounded-md border p-3">
      <div className="min-w-44 flex-1 space-y-1.5">
        <label className="text-muted-foreground block text-xs font-medium">
          Asignar árbitro a todos
        </label>
        <ReactSelect<SelectOption<number>>
          isClearable
          isDisabled={assignStage.isPending}
          placeholder="Sin árbitro (quitar)"
          options={refereeOptions}
          value={selectedReferee}
          onChange={(opt) => setRefereeId(opt?.value ?? null)}
          noOptionsMessage={() => 'Sin árbitros'}
        />
      </div>
      <div className="min-w-40 flex-1 space-y-1.5">
        <label className="text-muted-foreground block text-xs font-medium">
          Alcance
        </label>
        <ReactSelect<SelectOption<number>>
          isClearable
          isDisabled={assignStage.isPending}
          placeholder="Toda la fase"
          options={roundOptions}
          value={selectedRound}
          onChange={(opt) => setRoundId(opt?.value ?? null)}
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={onApply}
        disabled={assignStage.isPending}
      >
        {assignStage.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : null}
        Aplicar
      </Button>
    </div>
  )
}
