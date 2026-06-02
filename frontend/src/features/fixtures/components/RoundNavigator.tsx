import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RoundNavigatorProps {
  /** Distinct, ascending round numbers available in the current scope. */
  roundNumbers: number[]
  /** Currently selected round number, or undefined for "all rounds". */
  value: number | undefined
  onChange: (round: number | undefined) => void
}

/**
 * Prev/next round navigation, with an "all rounds" toggle. The active round is
 * reflected in the URL by the parent via {@link onChange}.
 */
export function RoundNavigator({
  roundNumbers,
  value,
  onChange,
}: RoundNavigatorProps) {
  if (roundNumbers.length === 0) return null

  const currentIndex = value != null ? roundNumbers.indexOf(value) : -1
  const hasPrev = currentIndex > 0
  const hasNext =
    currentIndex >= 0 && currentIndex < roundNumbers.length - 1

  const goPrev = () => {
    if (hasPrev) onChange(roundNumbers[currentIndex - 1])
  }
  const goNext = () => {
    if (currentIndex < 0) {
      onChange(roundNumbers[0])
    } else if (hasNext) {
      onChange(roundNumbers[currentIndex + 1])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={value == null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange(undefined)}
      >
        Todas
      </Button>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={!hasPrev}
          onClick={goPrev}
          aria-label="Jornada anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-24 text-center text-sm font-medium">
          {value != null ? `Jornada ${value}` : 'Sin filtrar'}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={currentIndex >= 0 && !hasNext}
          onClick={goNext}
          aria-label="Jornada siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
