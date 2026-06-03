import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Reads the "archivados" view flag from the URL (?archivados=1) and exposes a
 * setter that patches the query string — keeping the archived/active toggle
 * shareable and navigable via browser back/forward.
 *
 * Shared by the dashboard ("Mis torneos") and "Torceos que sigo" so both views
 * filter archived items the same way: by URL.
 */
export function useArchivedFilter() {
  const [searchParams, setSearchParams] = useSearchParams()

  const archived = useMemo(
    () => searchParams.get('archivados') === '1',
    [searchParams],
  )

  const setArchived = useCallback(
    (value: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) {
            next.set('archivados', '1')
          } else {
            next.delete('archivados')
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { archived, setArchived }
}
