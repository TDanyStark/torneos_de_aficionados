import { useRef, useState } from 'react'
import { ImageIcon, Loader2Icon, UploadIcon, UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  /** Current image URL (relative `/uploads/...`) or null. */
  currentUrl: string | null
  /** Uploads the file and resolves to the stored URL. */
  upload: (file: File) => Promise<string>
  /** Called with the new URL after a successful upload. */
  onUploaded?: (url: string) => void
  /** Accessible label / alt text. */
  label: string
  /** Preview shape. `circle` for player photos, `square` for logos. */
  shape?: 'square' | 'circle'
  /** Capture from camera on mobile (player photos). */
  capture?: boolean
  /** Compact preview (used inline in roster rows). */
  size?: 'sm' | 'md'
  disabled?: boolean
}

/**
 * Reusable single-image uploader: shows a preview, opens a file picker (or the
 * camera when `capture`), runs the provided upload function (multipart handled
 * by the caller's hook) and surfaces toast feedback. The backend crops to
 * 398×398. Decoupled from any specific entity — pass the `upload` function.
 */
export function ImageUploader({
  currentUrl,
  upload,
  onUploaded,
  label,
  shape = 'square',
  capture = false,
  size = 'md',
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [pending, setPending] = useState(false)

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen.')
      return
    }
    setPending(true)
    try {
      const url = await upload(file)
      setPreview(url)
      onUploaded?.(url)
      toast.success('Imagen actualizada')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo subir la imagen',
      )
    } finally {
      setPending(false)
    }
  }

  const box = size === 'sm' ? 'size-14' : 'size-24'
  const Placeholder = shape === 'circle' ? UserIcon : ImageIcon

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          'bg-muted relative flex shrink-0 items-center justify-center overflow-hidden border',
          box,
          shape === 'circle' ? 'rounded-full' : 'rounded-md',
        )}
      >
        {preview ? (
          <img src={preview} alt={label} className="size-full object-cover" />
        ) : (
          <Placeholder className="text-muted-foreground size-8" />
        )}
        {pending && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
            <Loader2Icon className="size-6 animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          {...(capture ? { capture: 'environment' as const } : {})}
          className="hidden"
          onChange={handleSelect}
        />
        <Button
          type="button"
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          disabled={pending || disabled}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <UploadIcon className="size-4" />
          )}
          {preview ? 'Cambiar' : 'Subir'}
        </Button>
        <p className="text-muted-foreground text-xs">
          Se recorta a 398×398 px automáticamente.
        </p>
      </div>
    </div>
  )
}
