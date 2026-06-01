import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/shared/StateMessage'
import { useStages } from '../api/useStages'

interface Props {
  tournamentId: number
  value: number | null
  onChange: (stageId: number) => void
}

/** Lets the organizer pick a stage to manage (groups / advancement rules). */
export function StagePicker({ tournamentId, value, onChange }: Props) {
  const { data: stages, isLoading } = useStages(tournamentId)

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando fases…</p>
  }
  if (!stages || stages.length === 0) {
    return (
      <EmptyState
        title="Sin fases"
        description="Primero crea fases en el paso anterior."
      />
    )
  }

  return (
    <div className="max-w-xs">
      <label className="text-sm font-medium">Fase</label>
      <Select
        value={value ? String(value) : ''}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Selecciona una fase" />
        </SelectTrigger>
        <SelectContent>
          {stages.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
