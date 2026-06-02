import { useEffect } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
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
import { applyApiError } from '@/lib/formErrors'
import {
  adCreativeSchema,
  DEFAULT_AD_CREATIVE_FORM,
  type AdCreativeFormValues,
} from '../schemas'
import {
  creativeFormToCreatePayload,
  creativeFormToUpdatePayload,
  creativeToForm,
} from '../mappers'
import { useCreateAdCreative, useUpdateAdCreative } from '../api/useAds'
import { MediaUploadField } from './MediaUploadField'
import type { AdCreative } from '../types'

interface CreativeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The slot this creative belongs to. */
  slotId: number
  /** Present when editing an existing (sold) creative; absent when creating. */
  creative?: AdCreative
  onSaved: () => void
}

/**
 * Create / edit a SOLD creative for a slot. Media is uploaded via
 * MediaUploadField (sets media_url + media_type). is_default is never offered —
 * the backend forces it to 0.
 */
export function CreativeDialog({
  open,
  onOpenChange,
  slotId,
  creative,
  onSaved,
}: CreativeDialogProps) {
  const isEdit = Boolean(creative)
  const create = useCreateAdCreative()
  const update = useUpdateAdCreative(creative?.id ?? 0)
  const submitting = create.isPending || update.isPending

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<AdCreativeFormValues>({
    resolver: zodResolver(adCreativeSchema),
    defaultValues: creative
      ? creativeToForm(creative)
      : DEFAULT_AD_CREATIVE_FORM,
  })

  useEffect(() => {
    if (open) {
      reset(creative ? creativeToForm(creative) : DEFAULT_AD_CREATIVE_FORM)
    }
  }, [open, creative, reset])

  const mediaUrlValue = useWatch({ control, name: 'media_url' })
  const mediaType = useWatch({ control, name: 'media_type' })

  const submit = handleSubmit(async (values) => {
    try {
      if (isEdit && creative) {
        await update.mutateAsync(creativeFormToUpdatePayload(values))
      } else {
        await create.mutateAsync(
          creativeFormToCreatePayload(values, slotId),
        )
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      applyApiError(error, setError, [
        'media_url',
        'media_type',
        'cta_url',
        'cta_label',
        'starts_at',
        'ends_at',
        'is_active',
      ])
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar creative' : 'Nuevo creative'}</DialogTitle>
          <DialogDescription>
            Sube una imagen o video y define un CTA opcional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Media</Label>
            <Controller
              control={control}
              name="media_url"
              render={() => (
                <MediaUploadField
                  value={mediaUrlValue}
                  mediaType={mediaType}
                  onUploaded={(url, type) => {
                    setValue('media_url', url, { shouldValidate: true })
                    setValue('media_type', type, { shouldValidate: true })
                  }}
                  onClear={() => {
                    setValue('media_url', '', { shouldValidate: true })
                  }}
                  disabled={submitting}
                />
              )}
            />
            {errors.media_url ? (
              <p className="text-destructive text-xs">
                {errors.media_url.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cta-url">CTA — URL (opcional)</Label>
            <Input
              id="cta-url"
              type="url"
              placeholder="https://…"
              {...register('cta_url')}
            />
            {errors.cta_url ? (
              <p className="text-destructive text-xs">
                {errors.cta_url.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cta-label">CTA — Texto (opcional)</Label>
            <Input
              id="cta-label"
              placeholder="Ej. Visita nuestra tienda"
              {...register('cta_label')}
            />
            {errors.cta_label ? (
              <p className="text-destructive text-xs">
                {errors.cta_label.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="starts-at">Inicio (opcional)</Label>
              <Input
                id="starts-at"
                type="datetime-local"
                {...register('starts_at')}
              />
              {errors.starts_at ? (
                <p className="text-destructive text-xs">
                  {errors.starts_at.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ends-at">Fin (opcional)</Label>
              <Input
                id="ends-at"
                type="datetime-local"
                {...register('ends_at')}
              />
              {errors.ends_at ? (
                <p className="text-destructive text-xs">
                  {errors.ends_at.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Activo</Label>
              <p className="text-muted-foreground text-xs">
                Solo los creatives activos y vigentes se muestran.
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
