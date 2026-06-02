import { toast } from 'sonner'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import { ApiError } from '@/lib/apiClient'
import type { Referee } from '@/features/tournaments/types'
import { useAssignMatchReferee } from '@/features/tournaments/api/useReferees'

interface MatchRefereeSelectProps {
  tournamentId: number
  matchId: number
  /** Currently assigned referee id (match.referee_id), or null. */
  refereeId: number | null
  referees: Referee[]
}

/**
 * Compact per-match referee selector. Clearing it sends `referee_id: null`
 * ("Sin árbitro"). Fixtures are invalidated by the mutation so the value
 * stays in sync across the manager.
 */
export function MatchRefereeSelect({
  tournamentId,
  matchId,
  refereeId,
  referees,
}: MatchRefereeSelectProps) {
  const assign = useAssignMatchReferee(tournamentId)

  const options: SelectOption<number>[] = referees.map((r) => ({
    value: r.id,
    label: r.name,
  }))
  const selected = options.find((o) => o.value === refereeId) ?? null

  const onChange = async (next: number | null) => {
    if (next === refereeId) return
    try {
      await assign.mutateAsync({ matchId, referee_id: next })
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo asignar el árbitro',
      )
    }
  }

  return (
    <div className="w-40">
      <ReactSelect<SelectOption<number>>
        isClearable
        isDisabled={assign.isPending}
        isLoading={assign.isPending}
        placeholder="Sin árbitro"
        options={options}
        value={selected}
        onChange={(opt) => onChange(opt?.value ?? null)}
        noOptionsMessage={() => 'Sin árbitros'}
      />
    </div>
  )
}
