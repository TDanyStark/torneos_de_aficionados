import { Link } from 'react-router-dom'
import { Settings2, Shield, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/authStore'
import type { Team } from '../types'
import { TeamStatusBadge } from './TeamStatusBadge'

interface TeamLeagueRowProps {
  team: Team
  /** Tournament slug used to build the public/management links. */
  tournamentSlug: string
  /** Tournament id, used to resolve the current user's per-tournament role. */
  tournamentId: number
  /** Organizer-only: request deletion of this team (opens the confirm dialog). */
  onDelete?: (team: Team) => void
}

/**
 * A single league-style team row (replaces the old card grid). Shows the crest,
 * name, short name and status badge. The trailing action depends on the viewer:
 * managers (organizer or owner delegate) get a "Gestionar" link; the public
 * gets a "Ver plantilla" link to the FIFA-card roster. Organizers also get a
 * delete button.
 */
export function TeamLeagueRow({
  team,
  tournamentSlug,
  tournamentId,
  onDelete,
}: TeamLeagueRowProps) {
  const roles = useAuthStore((s) => s.roles)
  const userId = useAuthStore((s) => s.user?.id)
  const isOrganizer = roles.some(
    (r) => r.tournament_id === tournamentId && r.role === 'organizer',
  )
  const isMyTeam =
    !isOrganizer &&
    (roles.some(
      (r) =>
        r.tournament_id === tournamentId &&
        r.role === 'delegate' &&
        r.team_id === team.id,
    ) ||
      (team.delegate_user_id != null && team.delegate_user_id === userId))
  const canManage = isMyTeam || isOrganizer

  return (
    <li className="flex items-center gap-3 p-3">
      <Avatar className="size-9">
        {team.logo_url ? (
          <AvatarImage src={team.logo_url} alt={team.name} />
        ) : null}
        <AvatarFallback>
          <Shield className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={
              canManage
                ? `/t/${tournamentSlug}/teams/${team.id}/manage`
                : `/t/${tournamentSlug}/equipo/${team.id}`
            }
            className="hover:text-brand truncate text-sm font-medium underline-offset-2 hover:underline"
          >
            {team.name}
          </Link>
          {isMyTeam ? <Badge variant="secondary">Mi equipo</Badge> : null}
        </div>
        {team.short_name ? (
          <p className="text-muted-foreground truncate text-xs">
            {team.short_name}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <TeamStatusBadge status={team.status} />
        {canManage ? (
          <Button variant="ghost" size="icon" aria-label="Gestionar equipo" asChild>
            <Link to={`/t/${tournamentSlug}/teams/${team.id}/manage`}>
              <Settings2 className="size-4" />
            </Link>
          </Button>
        ) : null}
        {isOrganizer && onDelete ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Eliminar equipo"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(team)}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </li>
  )
}
