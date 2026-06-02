/**
 * Resolves a creative's `media_url` to a loadable URL.
 *
 * The backend returns RELATIVE paths (`/uploads/ads/<file>`) by default. These
 * load directly in production (SPA + API are same-origin) and in dev through the
 * Vite `/uploads` proxy (see vite.config.ts). Absolute URLs (used only when the
 * API has APP_URL set) are returned untouched.
 */
export function mediaUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return url.startsWith('/') ? url : `/${url}`
}
