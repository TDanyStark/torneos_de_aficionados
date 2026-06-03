import { Navigate, useParams } from 'react-router-dom'
import type { TournamentTab } from '@/features/tournaments/hooks/useTournamentTabs'

interface LegacyTournamentRedirectProps {
  /** Target hub tab. Omit (or 'resumen') to land on the default Resumen tab. */
  tab?: TournamentTab
}

/**
 * Permanently forwards a legacy public `/tournaments/:slug/*` URL to the new
 * canonical tournament hub `/t/:slug?tab=...`, preserving the slug param. Uses
 * `replace` so the legacy URL is not kept in history.
 *
 * Defense-in-depth: the public hub resolves tournaments by SLUG only, so a
 * purely-numeric param is an organizer id that leaked into a public-shaped URL.
 * Management is now slug-based (`/t/:slug/*`) and we can't build a slug from an
 * id here, so forward those stragglers to the dashboard instead of 404-ing.
 */
export function LegacyTournamentRedirect({
  tab,
}: LegacyTournamentRedirectProps) {
  const { slug } = useParams<{ slug: string }>()
  if (slug && /^\d+$/.test(slug)) {
    return <Navigate to="/dashboard" replace />
  }
  const query = tab && tab !== 'resumen' ? `?tab=${tab}` : ''
  return <Navigate to={`/t/${slug}${query}`} replace />
}

/**
 * Forwards the legacy team-detail URL `/tournaments/:slug/teams/:teamId` to the
 * new canonical path `/t/:slug/equipo/:teamId`.
 */
export function LegacyTeamRedirect() {
  const { slug, teamId } = useParams<{ slug: string; teamId: string }>()
  return <Navigate to={`/t/${slug}/equipo/${teamId}`} replace />
}

/**
 * Forwards the old organizer "Equipos" and "Inscripciones" pages
 * (`/t/:slug/teams`, `/t/:slug/registrations`) to the unified teams section of
 * the edit page (`/t/:slug/edit?section=equipos`).
 */
export function LegacyTeamsAdminRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/t/${slug}/edit?section=equipos`} replace />
}
