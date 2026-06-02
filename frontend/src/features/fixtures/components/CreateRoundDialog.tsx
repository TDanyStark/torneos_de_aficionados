import { useState } from 'react'
import { CalendarPlus, Loader2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/apiClient'
import type { CreateRoundPayload } from '../types'
import { useCreateRound } from '../api/useManualFixtures'

interface CreateRoundDialogProps {
  tournamentId: number
  stageId: number
  /** Optional group scope for the new round (groups stages). */
  groupId?: number | null
  /** Called after a round is created successfully. */
  onCreated?: () => void
}

/**
 * Organizer action: manually create a round (jornada) in a stage. `number`
 * is optional — the backend auto-assigns max+1 when omitted.
 */
export function CreateRoundDialog({
  tournamentId,
  stageId,
  groupId,
  onCreated,
}: CreateRoundDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')

  const createRound = useCreateRound(tournamentId)

  const reset = () => {
    setName('')
    setNumber('')
    setScheduledDate('')
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const onSubmit = async () => {
    const payload: CreateRoundPayload & { stageId: number } = { stageId }
    const trimmedName = name.trim()
    if (trimmedName) payload.name = trimmedName
    if (number.trim()) payload.number = Number(number)
    if (scheduledDate) payload.scheduled_date = scheduledDate
    if (groupId != null) payload.group_id = groupId

    try {
      await createRound.mutateAsync(payload)
      toast.success('Fecha creada')
      onCreated?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo crear la fecha',
      )
    }
  }

  const busy = createRound.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus className="size-4" />
          Crear fecha
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear fecha</DialogTitle>
          <DialogDescription>
            Agrega una jornada manualmente. El número es opcional: si lo dejas
            vacío se asigna automáticamente al final.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="round-name">Nombre (opcional)</Label>
            <Input
              id="round-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Fecha 1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="round-number">Número (opcional)</Label>
            <Input
              id="round-number"
              type="number"
              min={1}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="automático"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="round-date">Fecha programada (opcional)</Label>
            <Input
              id="round-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
