import { Image as ImageIcon, Pencil, Trash2, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mediaUrl } from '../mediaUrl'
import type { AdCreative } from '../types'

interface CreativeRowProps {
  creative: AdCreative
  onEdit: () => void
  onDelete: () => void
}

/**
 * One creative line in the slot card. The DEFAULT banner is shown read-only
 * (badged "Por defecto") — it cannot be edited or deleted while the slot lives.
 */
export function CreativeRow({ creative, onEdit, onDelete }: CreativeRowProps) {
  const isDefault = creative.is_default === 1
  const resolved = creative.media_url ? mediaUrl(creative.media_url) : ''

  return (
    <div className="bg-muted/20 flex items-center gap-3 rounded-md border p-2">
      <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded">
        {isDefault || !resolved ? (
          <ImageIcon className="text-muted-foreground size-5" />
        ) : creative.media_type === 'video' ? (
          <Video className="text-muted-foreground size-5" />
        ) : (
          <img
            src={resolved}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {isDefault ? (
            <Badge variant="secondary">Por defecto</Badge>
          ) : (
            <Badge variant="outline" className="capitalize">
              {creative.media_type}
            </Badge>
          )}
          <Badge variant={creative.is_active === 1 ? 'default' : 'outline'}>
            {creative.is_active === 1 ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <p className="text-muted-foreground truncate text-xs">
          {creative.cta_label || creative.cta_url || 'Sin CTA'}
        </p>
      </div>

      {!isDefault ? (
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onEdit}
            aria-label="Editar creative"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive size-8"
            onClick={onDelete}
            aria-label="Eliminar creative"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
