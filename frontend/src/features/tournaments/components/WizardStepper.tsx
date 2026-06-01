import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEP_LABELS = [
  'Datos',
  'Configuración',
  'Fases',
  'Grupos',
  'Avance',
]

export function WizardStepper({
  step,
  onStepClick,
  maxReached,
}: {
  step: number
  maxReached: number
  onStepClick: (step: number) => void
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const isActive = n === step
        const isDone = n < step
        const reachable = n <= maxReached
        return (
          <li key={label} className="flex items-center gap-1">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onStepClick(n)}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors',
                isActive && 'bg-primary text-primary-foreground',
                !isActive && reachable && 'hover:bg-accent',
                !reachable && 'cursor-not-allowed opacity-50',
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border text-xs',
                  isActive && 'border-primary-foreground',
                  isDone && 'bg-brand text-brand-foreground border-transparent',
                )}
              >
                {isDone ? <Check className="size-3" /> : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {n < STEP_LABELS.length ? (
              <span className="text-muted-foreground">·</span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
