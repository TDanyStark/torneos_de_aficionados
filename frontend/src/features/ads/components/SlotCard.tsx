import { useState } from 'react'
import { Globe, Pencil, Plus, Trophy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ApiError } from '@/lib/apiClient'
import { useDeleteAdCreative, useDeleteAdSlot } from '../api/useAds'
import { PLACEMENT_LABELS } from './placementMeta'
import { CreativeRow } from './CreativeRow'
import { CreativeDialog } from './CreativeDialog'
import { SlotDialog } from './SlotDialog'
import type { AdCreative, AdSlotWithCreatives } from '../types'

interface SlotCardProps {
  slot: AdSlotWithCreatives
}

/** A single slot: header (scope/placement/state) + its creatives + actions. */
export function SlotCard({ slot }: SlotCardProps) {
  const [editingSlot, setEditingSlot] = useState(false)
  const [deletingSlot, setDeletingSlot] = useState(false)
  const [creativeDialog, setCreativeDialog] = useState<{
    open: boolean
    creative?: AdCreative
  }>({ open: false })
  const [deletingCreative, setDeletingCreative] = useState<AdCreative | null>(
    null,
  )

  const deleteSlot = useDeleteAdSlot()
  const deleteCreative = useDeleteAdCreative()

  const isGlobal = slot.tournament_id == null

  const onDeleteSlot = async () => {
    try {
      await deleteSlot.mutateAsync(slot.id)
      toast.success('Slot eliminado')
      setDeletingSlot(false)
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'No se pudo eliminar',
      )
    }
  }

  const onDeleteCreative = async () => {
    if (!deletingCreative) return
    try {
      await deleteCreative.mutateAsync(deletingCreative.id)
      toast.success('Creative eliminado')
      setDeletingCreative(null)
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'No se pudo eliminar',
      )
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold">{slot.name}</span>
            <Badge variant="secondary">
              {PLACEMENT_LABELS[slot.placement]}
            </Badge>
            <Badge variant={slot.is_active === 1 ? 'default' : 'outline'}>
              {slot.is_active === 1 ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            {isGlobal ? (
              <>
                <Globe className="size-3.5" />
                Global
              </>
            ) : (
              <>
                <Trophy className="size-3.5" />
                Torneo #{slot.tournament_id}
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setEditingSlot(true)}
            aria-label="Editar slot"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive size-8"
            onClick={() => setDeletingSlot(true)}
            aria-label="Eliminar slot"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {slot.creatives.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin creatives.</p>
        ) : (
          slot.creatives.map((creative) => (
            <CreativeRow
              key={creative.id}
              creative={creative}
              onEdit={() => setCreativeDialog({ open: true, creative })}
              onDelete={() => setDeletingCreative(creative)}
            />
          ))
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={() => setCreativeDialog({ open: true, creative: undefined })}
        >
          <Plus className="size-4" />
          Agregar creative
        </Button>
      </CardContent>

      <SlotDialog
        open={editingSlot}
        onOpenChange={setEditingSlot}
        slot={slot}
        onSaved={() => toast.success('Slot actualizado')}
      />

      <CreativeDialog
        open={creativeDialog.open}
        onOpenChange={(open) =>
          setCreativeDialog((s) => ({ ...s, open }))
        }
        slotId={slot.id}
        creative={creativeDialog.creative}
        onSaved={() =>
          toast.success(
            creativeDialog.creative ? 'Creative actualizado' : 'Creative creado',
          )
        }
      />

      <ConfirmDialog
        open={deletingSlot}
        onOpenChange={setDeletingSlot}
        title="¿Eliminar este slot?"
        description="Se eliminarán también todos sus creatives. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deleteSlot.isPending}
        onConfirm={onDeleteSlot}
      />

      <ConfirmDialog
        open={deletingCreative != null}
        onOpenChange={(open) => !open && setDeletingCreative(null)}
        title="¿Eliminar este creative?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deleteCreative.isPending}
        onConfirm={onDeleteCreative}
      />
    </Card>
  )
}
