import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import type { Stage, StageType } from '@/features/tournaments/types'

interface PhaseSelectorProps {
  stages: Stage[]
  value: number
  onChange: (stageId: number) => void
}

const TYPE_LABEL: Record<StageType, string> = {
  league: 'Liga',
  groups: 'Grupos',
  knockout: 'Eliminación',
}

/**
 * URL-driven phase (stage) selector for the tournament hub. Mirrors GroupSelect
 * styling via the shared ReactSelect. Options are labelled by stage name with
 * the stage type as a hint (e.g. "Fase de grupos · Grupos"). Not clearable —
 * a phase is always selected when the selector is shown (stages.length > 1).
 */
export function PhaseSelector({ stages, value, onChange }: PhaseSelectorProps) {
  const ordered = [...stages].sort((a, b) => a.position - b.position)
  const options: SelectOption<number>[] = ordered.map((s) => ({
    value: s.id,
    label: `${s.name} · ${TYPE_LABEL[s.type]}`,
  }))
  const selected = options.find((o) => o.value === value) ?? null

  return (
    <div className="w-full sm:w-72">
      <ReactSelect<SelectOption<number>>
        isClearable={false}
        placeholder="Seleccionar fase"
        options={options}
        value={selected}
        onChange={(opt) => {
          if (opt) onChange(opt.value)
        }}
      />
    </div>
  )
}
