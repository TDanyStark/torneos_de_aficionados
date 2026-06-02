import { useState } from 'react'
import { Loader2, Wand2 } from 'lucide-react'
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
import type { GenerateResult } from '../types'
import {
  useGenerateFixtures,
  useRegenerateFixtures,
} from '../api/useGenerateFixtures'

interface GenerateFixtureDialogProps {
  tournamentId: number
  stage: Stage
}

/**
 * Organizer action: generate fixtures for a stage with a confirmation dialog
 * and a post-generation summary. A 422 "already exists" is handled by offering
 * to regenerate instead.
 */
export function GenerateFixtureDialog({
  tournamentId,
  stage,
}: GenerateFixtureDialogProps) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [alreadyExists, setAlreadyExists] = useState(false)

  const generate = useGenerateFixtures(tournamentId)
  const regenerate = useRegenerateFixtures(tournamentId)

  const reset = () => {
    setResult(null)
    setAlreadyExists(false)
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const onGenerate = async () => {
    try {
      const res = await generate.mutateAsync(stage.id)
      setResult(res)
      setAlreadyExists(false)
      toast.success('Fixture generado')
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setAlreadyExists(true)
        toast.error(error.message)
      } else {
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'No se pudo generar el fixture',
        )
      }
    }
  }

  const onRegenerate = async () => {
    try {
      const res = await regenerate.mutateAsync(stage.id)
      toast.success(
        `Fixture regenerado: ${res.matches_created} partidos en ${res.affected_round_count} jornadas`,
      )
      setOpen(false)
      reset()
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo regenerar el fixture',
      )
    }
  }

  const busy = generate.isPending || regenerate.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wand2 className="size-4" />
          Generar fixture
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar fixture — {stage.name}</DialogTitle>
          <DialogDescription>
            Se crearán las jornadas y los partidos según el formato de la fase
            ({stage.type}). Esta acción requiere que los equipos estén
            asignados.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="bg-muted/50 space-y-1 rounded-md border p-3 text-sm">
            <p>
              Jornadas creadas:{' '}
              <strong className="tabular-nums">{result.rounds_created}</strong>
            </p>
            <p>
              Partidos creados:{' '}
              <strong className="tabular-nums">
                {result.matches_created}
              </strong>
            </p>
            {result.bracket_slots_created > 0 ? (
              <p>
                Llaves creadas:{' '}
                <strong className="tabular-nums">
                  {result.bracket_slots_created}
                </strong>
              </p>
            ) : null}
          </div>
        ) : alreadyExists ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
            Ya existe un fixture para esta fase. Puedes regenerarlo para
            integrar inscripciones tardías sin alterar lo ya jugado.
          </div>
        ) : null}

        <DialogFooter>
          {result ? (
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          ) : alreadyExists ? (
            <Button onClick={onRegenerate} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Regenerar
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button onClick={onGenerate} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Generar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
