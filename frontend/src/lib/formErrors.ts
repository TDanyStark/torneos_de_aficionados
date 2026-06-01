import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'
import { ApiError } from './apiClient'

/**
 * Maps a thrown error into React Hook Form field errors when possible, and
 * surfaces a toast for the general message. Unknown field keys fall back to
 * the root form error so nothing is silently dropped.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields?: readonly Path<T>[],
): void {
  if (error instanceof ApiError) {
    if (error.fieldErrors) {
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (!knownFields || knownFields.includes(field as Path<T>)) {
          setError(field as Path<T>, { type: 'server', message })
        } else {
          setError('root.serverError' as Path<T>, {
            type: 'server',
            message,
          })
        }
      }
    }
    toast.error(error.message)
    return
  }

  const message =
    error instanceof Error ? error.message : 'Ocurrió un error inesperado'
  toast.error(message)
}
