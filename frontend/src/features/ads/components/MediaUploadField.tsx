import { useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/apiClient'
import { useUploadMedia } from '../api/useAds'
import { mediaUrl } from '../mediaUrl'
import type { MediaType } from '../types'

interface MediaUploadFieldProps {
  /** Current media_url (form value). Empty = nothing uploaded yet. */
  value: string
  mediaType: MediaType
  /** Called after a successful upload with the stored url + resolved type. */
  onUploaded: (mediaUrl: string, mediaType: MediaType) => void
  onClear: () => void
  disabled?: boolean
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'

/**
 * File picker + preview for ad media. Uploads via useUploadMedia (multipart,
 * field `file`) and reports the resulting media_url + media_type to the form.
 * 422 (bad type/size) surfaces as a toast. No shadcn file primitive exists, so
 * this hand-builds a hidden <input type="file"> + button.
 */
export function MediaUploadField({
  value,
  mediaType,
  onUploaded,
  onClear,
  disabled,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadMedia()
  const [previewName, setPreviewName] = useState<string | null>(null)

  const onPick = () => inputRef.current?.click()

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Allow re-selecting the same file later.
    event.target.value = ''
    if (!file) return
    setPreviewName(file.name)
    try {
      const res = await upload.mutateAsync(file)
      onUploaded(res.media_url, res.media_type)
      toast.success('Archivo subido')
    } catch (error) {
      setPreviewName(null)
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('No se pudo subir el archivo')
      }
    }
  }

  const clear = () => {
    setPreviewName(null)
    onClear()
  }

  const resolved = value ? mediaUrl(value) : ''
  const uploading = upload.isPending

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onChange}
        disabled={disabled || uploading}
      />

      {resolved ? (
        <div className="bg-muted/30 relative overflow-hidden rounded-md border">
          {mediaType === 'video' ? (
            <video
              src={resolved}
              muted
              controls
              playsInline
              className="max-h-40 w-full object-contain"
            />
          ) : (
            <img
              src={resolved}
              alt="Vista previa"
              className="max-h-40 w-full object-contain"
            />
          )}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 size-7"
            onClick={clear}
            disabled={disabled || uploading}
            aria-label="Quitar archivo"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
          {uploading
            ? `Subiendo ${previewName ?? ''}…`
            : 'Imagen (JPG/PNG/WebP/GIF ≤5MB) o video (MP4/WebM ≤20MB)'}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onPick}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {resolved ? 'Cambiar archivo' : 'Subir archivo'}
      </Button>
    </div>
  )
}
