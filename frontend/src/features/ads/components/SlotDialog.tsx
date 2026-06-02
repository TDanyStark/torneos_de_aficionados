import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import { applyApiError } from '@/lib/formErrors'
import {
  adSlotSchema,
  DEFAULT_AD_SLOT_FORM,
  type AdSlotFormValues,
} from '../schemas'
import { slotFormToCreatePayload, slotFormToUpdatePayload, slotToForm } from '../mappers'
import { useCreateAdSlot, useUpdateAdSlot } from '../api/useAds'
import { PLACEMENT_LABELS } from './placementMeta'
import type { AdPlacement, AdSlot } from '../types'

interface SlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing; absent when creating. */
  slot?: AdSlot
  onSaved: () => void
}

const PLACEMENT_OPTIONS: SelectOption<AdPlacement>[] = (
  Object.keys(PLACEMENT_LABELS) as AdPlacement[]
).map((p) => ({ value: p, label: PLACEMENT_LABELS[p] }))

/**
 * Create / edit an ad slot. On create the backend auto-generates the default
 * WhatsApp banner creative. Placement is immutable in spirit but the backend
 * allows updating it; tournament_id is only set on create (global if empty).
 */
export function SlotDialog({ open, onOpenChange, slot, onSaved }: SlotDialogProps) {
  const isEdit = Boolean(slot)
  const create = useCreateAdSlot()
  const update = useUpdateAdSlot(slot?.id ?? 0)
  const submitting = create.isPending || update.isPending

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AdSlotFormValues>({
    resolver: zodResolver(adSlotSchema),
    defaultValues: slot ? slotToForm(slot) : DEFAULT_AD_SLOT_FORM,
  })

  useEffect(() => {
    if (open) {
      reset(slot ? slotToForm(slot) : DEFAULT_AD_SLOT_FORM)
    }
  }, [open, slot, reset])

  const submit = handleSubmit(async (values) => {
    try {
      if (isEdit && slot) {
        await update.mutateAsync(slotFormToUpdatePayload(values))
      } else {
        await create.mutateAsync(slotFormToCreatePayload(values))
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      applyApiError(error, setError, [
        'placement',
        'name',
        'tournament_id',
        'is_active',
      ])
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar slot' : 'Nuevo slot'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza la posición, el nombre o el estado del slot.'
              : 'Al crear el slot se genera su banner por defecto (WhatsApp).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="slot-placement">Posición</Label>
            <Controller
              control={control}
              name="placement"
              render={({ field }) => (
                <ReactSelect<SelectOption<AdPlacement>>
                  inputId="slot-placement"
                  options={PLACEMENT_OPTIONS}
                  placeholder="Selecciona una posición…"
                  value={
                    PLACEMENT_OPTIONS.find((o) => o.value === field.value) ??
                    null
                  }
                  onChange={(opt) => field.onChange(opt?.value ?? 'header')}
                />
              )}
            />
            {errors.placement ? (
              <p className="text-destructive text-xs">
                {errors.placement.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slot-name">Nombre</Label>
            <Input
              id="slot-name"
              placeholder="Ej. Banner principal"
              {...register('name')}
            />
            {errors.name ? (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            ) : null}
          </div>

          {!isEdit ? (
            <div className="space-y-1.5">
              <Label htmlFor="slot-tournament">
                ID de torneo (opcional)
              </Label>
              <Input
                id="slot-tournament"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Vacío = global"
                {...register('tournament_id')}
              />
              <p className="text-muted-foreground text-xs">
                Déjalo vacío para un slot global (toda la plataforma).
              </p>
              {errors.tournament_id ? (
                <p className="text-destructive text-xs">
                  {errors.tournament_id.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Activo</Label>
              <p className="text-muted-foreground text-xs">
                Los slots inactivos no se sirven.
              </p>
            </div>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
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
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
