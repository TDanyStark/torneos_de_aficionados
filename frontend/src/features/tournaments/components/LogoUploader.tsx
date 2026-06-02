import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Loader2Icon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/apiClient'
import { tournamentKeys } from '@/features/tournaments/api/useTournaments'
import type { UploadLogoResponse } from '@/features/tournaments/types'

/**
 * Backend multipart field name — see UploadTournamentLogoAction::FIELD ('file').
 */
const LOGO_FIELD = 'file'

interface LogoUploaderProps {
  tournamentId: number
  /** Current logo URL (relative `/uploads/...`) or null. */
  logoUrl: string | null
  /** Slug of the tournament, used to invalidate the public detail query. */
  slug?: string
  /** Called with the new URL after a successful upload. */
  onUploaded?: (logoUrl: string) => void
}

/**
 * Tournament logo uploader. Posts a single image as multipart/form-data to
 * `/tournaments/{id}/logo`; the backend center-crops/compresses it to 398x398,
 * persists the URL and returns it. Shows a live preview and toast feedback.
 */
export function LogoUploader({
  tournamentId,
  logoUrl,
  slug,
  onUploaded,
}: LogoUploaderProps) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(logoUrl)

  const upload = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append(LOGO_FIELD, file)
      return apiClient.postForm<UploadLogoResponse>(
        `/tournaments/${tournamentId}/logo`,
        formData,
      )
    },
    onSuccess: (data) => {
      setPreview(data.logo_url)
      qc.invalidateQueries({
        queryKey: [...tournamentKeys.all, 'by-id', tournamentId],
      })
      if (slug) {
        qc.invalidateQueries({ queryKey: tournamentKeys.detail(slug) })
      }
      onUploaded?.(data.logo_url)
      toast.success('Logo actualizado')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo subir el logo',
      )
    },
  })

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Allow re-selecting the same file by clearing the input value.
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen.')
      return
    }
    upload.mutate(file)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="bg-muted relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border">
        {preview ? (
          <img
            src={preview}
            alt="Logo del torneo"
            className="size-full object-cover"
          />
        ) : (
          <ImageIcon className="text-muted-foreground size-8" />
        )}
        {upload.isPending && (
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
          className="hidden"
          onChange={handleSelect}
        />
        <Button
          type="button"
          variant="outline"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <UploadIcon className="size-4" />
          )}
          {preview ? 'Cambiar logo' : 'Subir logo'}
        </Button>
        <p className="text-muted-foreground text-xs">
          La imagen se recorta a 398×398 px automáticamente.
        </p>
      </div>
    </div>
  )
}
