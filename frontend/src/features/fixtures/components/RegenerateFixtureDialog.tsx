import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/apiClient'
import type { Stage } from '@/features/tournaments/types'
import type { RegenerateResult } from '../types'
import { useRegenerateFixtures } from '../api/useGenerateFixtures'

interface RegenerateFixtureDialogProps {
  tournamentId: number
  stage: Stage
}

/**
 * Organizer action: regenerate future rounds of a stage to integrate late
 * approved registrations. Shows the impact summary before confirming and after
 * completion. Never alters finished/live matches (enforced server-side).
 */
export function RegenerateFixtureDialog({
  tournamentId,
  stage,
}: RegenerateFixtureDialogProps) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<RegenerateResult | null>(null)

  const regenerate = useRegenerateFixtures(tournamentId)

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setResult(null)
  }

  const onConfirm = async () => {
    try {
      const res = await regenerate.mutateAsync(stage.id)
      setResult(res)
      toast.success('Fixture regenerado')
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo regenerar el fixture',
      )
    }
  }

  const busy = regenerate.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="size-4" />
          Regenerar fixture
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerar fixture — {stage.name}</DialogTitle>
          <DialogDescription>
            Recalcula las jornadas futuras para integrar equipos con
            inscripción tardía. Conserva lo ya jugado o en curso; es una
            operación idempotente sobre lo no jugado.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="bg-muted/50 space-y-1 rounded-md border p-3 text-sm">
            <p>
              Jornadas afectadas:{' '}
              <strong className="tabular-nums">
                {result.affected_round_count}
              </strong>
            </p>
            <p>
              Partidos creados:{' '}
              <strong className="tabular-nums">
                {result.matches_created}
              </strong>
            </p>
            <p>
              Jornadas eliminadas (no jugadas):{' '}
              <strong className="tabular-nums">{result.rounds_removed}</strong>
            </p>
            {result.scopes.length === 0 ? (
              <p className="text-muted-foreground">
                No había inscripciones tardías pendientes de integrar.
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          {result ? (
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button onClick={onConfirm} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Regenerar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
