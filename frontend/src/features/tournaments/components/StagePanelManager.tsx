import { useState } from 'react'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import { EmptyState } from '@/components/shared/StateMessage'
import { useStages } from '../api/useStages'
import { GroupBuilder } from './GroupBuilder'
import { AdvancementRuleManager } from './AdvancementRuleManager'

interface StagePanelManagerProps {
  tournamentId: number
}

/**
 * Per-stage management area: pick a stage, then manage its groups (only for
 * `groups` stages) and its advancement rules. Sits below StageManager inside
 * the organizer-gated "Fases" card.
 */
export function StagePanelManager({ tournamentId }: StagePanelManagerProps) {
  const { data: stages, isLoading } = useStages(tournamentId)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando fases…</p>
  }

  if (!stages || stages.length === 0) {
    return (
      <EmptyState
        title="Sin fases"
        description="Crea una fase arriba para gestionar sus grupos y reglas de avance."
      />
    )
  }

  const options: SelectOption<number>[] = stages.map((s) => ({
    value: s.id,
    label: s.name,
  }))
  // Derive the active stage: explicit selection (if still valid) or the first.
  const selectedStage =
    stages.find((s) => s.id === selectedId) ?? stages[0]

  return (
    <div className="space-y-5">
      <div className="w-full sm:w-72">
        <label className="text-muted-foreground mb-1 block text-sm font-medium">
          Gestionar fase
        </label>
        <ReactSelect<SelectOption<number>>
          options={options}
          value={options.find((o) => o.value === selectedStage.id) ?? null}
          onChange={(opt) => setSelectedId(opt?.value ?? null)}
        />
      </div>

      <div className="space-y-6">
        {selectedStage.type === 'groups' ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Grupos y equipos</h3>
            <GroupBuilder
              stageId={selectedStage.id}
              tournamentId={tournamentId}
            />
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Reglas de avance</h3>
          <AdvancementRuleManager
            stageId={selectedStage.id}
            tournamentId={tournamentId}
          />
        </section>
      </div>
    </div>
  )
}
