import { useEffect, useState } from 'react'
import { Loader2, Pause, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { LiveMatch } from '../types'

interface PeriodTimerProps {
  snapshot: LiveMatch
  /** Total periods allowed (tournaments.periods_count). */
  periodsCount: number
  onStart: () => void
  onEnd: () => void
  starting: boolean
  ending: boolean
}

/** Parse a "Y-m-d H:i:s" backend datetime into epoch ms (local-safe). */
function parseStarted(value: string | null): number | null {
  if (!value) return null
  const t = new Date(value.replace(' ', 'T')).getTime()
  return Number.isNaN(t) ? null : t
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Referee cronómetro: shows the active period number + a live-ticking clock
 * derived from active_period.started_at, plus start/stop controls gated by the
 * match status and the configured periods_count.
 */
export function PeriodTimer({
  snapshot,
  periodsCount,
  onStart,
  onEnd,
  starting,
  ending,
}: PeriodTimerProps) {
  const { match, active_period, periods } = snapshot
  const startedAt = parseStarted(active_period?.started_at ?? null)
  const [now, setNow] = useState(() => Date.now())

  // Tick once per second only while a period is running.
  useEffect(() => {
    if (startedAt == null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const elapsed = startedAt != null ? formatElapsed(now - startedAt) : '--:--'

  const finishedCount = periods.filter((p) => p.status === 'finished').length
  const hasRunning = active_period != null
  const finished = match.status === 'finished'

  // Can start the next period: not running, not finished, and under the cap.
  const canStart = !hasRunning && !finished && finishedCount < periodsCount
  const nextNumber = finishedCount + 1

  return (
    <Card>
      <CardContent className="space-y-4 py-6 text-center">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {hasRunning
            ? `Período ${active_period.number} en curso`
            : finished
              ? 'Partido finalizado'
              : canStart
                ? `Listo para el período ${nextNumber} de ${periodsCount}`
                : 'Descanso'}
        </p>

        <p className="text-5xl font-bold tabular-nums">{elapsed}</p>

        <div className="flex items-center justify-center gap-3">
          {hasRunning ? (
            <Button
              size="lg"
              variant="secondary"
              onClick={onEnd}
              disabled={ending}
              className="min-w-40"
            >
              {ending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Pause className="size-5" />
              )}
              Cerrar período
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={onStart}
              disabled={!canStart || starting}
              className="min-w-40"
            >
              {starting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Play className="size-5" />
              )}
              Iniciar período {canStart ? nextNumber : ''}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
