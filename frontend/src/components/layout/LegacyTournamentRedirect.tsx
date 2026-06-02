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
 * purely-numeric param is an organizer id that leaked into a public-shaped URL
 * (e.g. an authed link shadowed by this legacy route). In that case redirect to
 * the organizer fixtures management page instead of producing a slug 404.
 */
export function LegacyTournamentRedirect({
  tab,
}: LegacyTournamentRedirectProps) {
  const { slug } = useParams<{ slug: string }>()
  if (slug && /^\d+$/.test(slug)) {
    const target =
      tab === 'fixtures' ? `/tournaments/${slug}/fixtures` : `/tournaments/${slug}/edit`
    return <Navigate to={target} replace />
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
