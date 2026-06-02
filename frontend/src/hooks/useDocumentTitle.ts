import { useEffect } from 'react'

const APP_NAME = 'Torneos de Aficionados'

/** Resolve/create the <meta name="description"> element. */
function getDescriptionMeta(): HTMLMetaElement | null {
  if (typeof document === 'undefined') return null
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  )
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
  }
  return meta
}

/**
 * Lightweight client-side SEO helper for the SPA. Sets `document.title` (and,
 * optionally, the `<meta name="description">` content) for the lifetime of the
 * component, restoring the previous values on unmount.
 *
 * - `useDocumentTitle('Torneos')` → `Torneos · Torneos de Aficionados`
 * - `useDocumentTitle()` → just the app name (good default for the home).
 *
 * @param title       Page-specific title. Falsy → only the app name is shown.
 * @param description Optional meta description for the page.
 */
export function useDocumentTitle(title?: string, description?: string): void {
  useEffect(() => {
    if (typeof document === 'undefined') return

    const previousTitle = document.title
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME

    let meta: HTMLMetaElement | null = null
    let previousDescription: string | null = null
    if (description !== undefined) {
      meta = getDescriptionMeta()
      if (meta) {
        previousDescription = meta.getAttribute('content')
        meta.setAttribute('content', description)
      }
    }

    return () => {
      document.title = previousTitle
      if (meta) {
        if (previousDescription === null) {
          meta.removeAttribute('content')
        } else {
          meta.setAttribute('content', previousDescription)
        }
      }
    }
  }, [title, description])
}
