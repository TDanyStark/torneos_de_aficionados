import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import { ApiError } from '@/lib/apiClient'
import { useRoster } from '@/features/teams/api/useRoster'
import type { LiveMatch, RecordableEventType, RecordEventPayload } from '../types'
import {
  recordEventSchema,
  DEFAULT_RECORD_EVENT_FORM,
  type RecordEventFormValues,
} from '../schemas'
import { RECORDABLE_LABELS } from './eventMeta'

interface RecordEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  snapshot: LiveMatch
  /** Pre-selected event type + team (from the big EventButtons). */
  eventType: RecordableEventType
  teamId: number
  onSubmit: (payload: RecordEventPayload) => Promise<void>
  submitting: boolean
}

/**
 * Quick dialog to record an event: pick the player (ReactSelect filtered to the
 * chosen team's roster) + minute, then submit. The team + type are pre-selected
 * by the caller's button; the player comes from the team_players roster.
 */
export function RecordEventDialog({
  open,
  onOpenChange,
  snapshot,
  eventType,
  teamId,
  onSubmit,
  submitting,
}: RecordEventDialogProps) {
  const isHome = teamId === snapshot.match.home_team_id
  const teamLabel = isHome ? 'Local' : 'Visitante'

  // Roster of the selected team for the player picker.
  const roster = useRoster(teamId || undefined)
  const playerOptions = useMemo<SelectOption<number>[]>(
    () =>
      (roster.data ?? []).map((tp) => ({
        value: tp.player_id,
        label: tp.shirt_number
          ? `#${tp.shirt_number} · ${tp.full_name}`
          : tp.full_name,
      })),
    [roster.data],
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RecordEventFormValues>({
    resolver: zodResolver(recordEventSchema),
    defaultValues: {
      ...DEFAULT_RECORD_EVENT_FORM,
      type: eventType,
      team_id: String(teamId),
    },
  })

  // Re-seed type/team each time the dialog opens for a different button.
  useEffect(() => {
    if (open) {
      reset({
        ...DEFAULT_RECORD_EVENT_FORM,
        type: eventType,
        team_id: String(teamId),
      })
    }
  }, [open, eventType, teamId, reset])

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        type: values.type as RecordableEventType,
        team_id: Number(values.team_id),
        player_id: Number(values.player_id),
        minute: Number(values.minute),
      })
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          for (const [field, message] of Object.entries(error.fieldErrors)) {
            if (field === 'player_id' || field === 'minute' || field === 'team_id') {
              setError(field, { message })
            }
          }
        }
        toast.error(error.message)
      } else {
        toast.error('No se pudo registrar el evento')
      }
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {RECORDABLE_LABELS[eventType]} — {teamLabel}
          </DialogTitle>
          <DialogDescription>
            Selecciona el jugador y el minuto. El marcador se deriva
            automáticamente de los eventos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="event-player">Jugador</Label>
            <Controller
              control={control}
              name="player_id"
              render={({ field }) => (
                <ReactSelect<SelectOption<number>>
                  inputId="event-player"
                  options={playerOptions}
                  isLoading={roster.isLoading}
                  placeholder="Buscar jugador…"
                  noOptionsMessage={() => 'Sin jugadores en el equipo'}
                  value={
                    playerOptions.find(
                      (o) => String(o.value) === field.value,
                    ) ?? null
                  }
                  onChange={(opt) =>
                    field.onChange(opt ? String(opt.value) : '')
                  }
                />
              )}
            />
            {errors.player_id ? (
              <p className="text-destructive text-xs">
                {errors.player_id.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-minute">Minuto</Label>
            <Input
              id="event-minute"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Ej. 23"
              {...register('minute')}
            />
            {errors.minute ? (
              <p className="text-destructive text-xs">
                {errors.minute.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
